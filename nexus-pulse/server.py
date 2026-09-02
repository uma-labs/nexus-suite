#!/usr/bin/env python3
"""NEXUS Pulse — static file server + Yahoo Finance quote/chart proxy. No API keys."""
from __future__ import annotations

import json
import os
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PORT = int(os.environ.get("PORT", "8788"))
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)
CACHE_TTL = 8.0
_cache: dict[str, tuple[float, dict]] = {}
_lock = threading.Lock()


def _yahoo_get(url: str, timeout: float = 10.0) -> dict:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": UA,
            "Accept": "application/json,text/plain,*/*",
            "Accept-Language": "en-US,en;q=0.9",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8", "replace"))


def fetch_symbol(symbol: str, with_spark: bool = True) -> dict:
    sym = symbol.strip().upper()
    if not sym:
        return {"symbol": symbol, "error": "empty symbol", "ok": False}

    cache_key = f"{sym}:{'spark' if with_spark else 'meta'}"
    now = time.time()
    with _lock:
        hit = _cache.get(cache_key)
        if hit and now - hit[0] < CACHE_TTL:
            return dict(hit[1])

    url = (
        "https://query1.finance.yahoo.com/v8/finance/chart/"
        + urllib.parse.quote(sym)
        + "?interval=1m&range=1d&includePrePost=true"
    )
    try:
        data = _yahoo_get(url)
    except urllib.error.HTTPError as e:
        row = {"symbol": sym, "ok": False, "error": f"http {e.code}"}
        return row
    except Exception as e:
        return {"symbol": sym, "ok": False, "error": str(e)[:160]}

    results = (data.get("chart") or {}).get("result") or []
    if not results:
        err = (data.get("chart") or {}).get("error")
        return {
            "symbol": sym,
            "ok": False,
            "error": str(err) if err else "no chart result",
        }

    result = results[0]
    meta = result.get("meta") or {}
    price = meta.get("regularMarketPrice")
    if price is None:
        price = meta.get("postMarketPrice")
    if price is None:
        price = meta.get("preMarketPrice")
    prev = meta.get("previousClose") or meta.get("chartPreviousClose")
    change = None
    pct = None
    if price is not None and prev not in (None, 0):
        change = price - prev
        pct = (change / prev) * 100.0

    spark = []
    if with_spark:
        closes = ((result.get("indicators") or {}).get("quote") or [{}])[0].get("close") or []
        spark = [c for c in closes if c is not None]
        # downsample to ~48 points for card SVG
        if len(spark) > 48:
            step = len(spark) / 48.0
            spark = [spark[int(i * step)] for i in range(48)]

    row = {
        "symbol": sym,
        "ok": price is not None,
        "price": price,
        "last": price,
        "previousClose": prev,
        "change": change,
        "pct": pct,
        "volume": meta.get("regularMarketVolume"),
        "marketState": meta.get("marketState"),
        "exchange": meta.get("exchangeName"),
        "currency": meta.get("currency"),
        "shortName": meta.get("shortName") or meta.get("longName") or sym,
        "regularMarketTime": meta.get("regularMarketTime"),
        "spark": spark if with_spark else [],
        "delayed": True,
        "error": None if price is not None else "no price in meta",
    }
    with _lock:
        _cache[cache_key] = (now, dict(row))
    return row


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt: str, *args) -> None:
        print(f"[pulse] {self.address_string()} {fmt % args}", flush=True)

    def _cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cache-Control", "no-store")

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        parsed = urllib.parse.urlparse(self.path)
        raw = parsed.path or "/"

        # Support mount under /pulse/ (rewrite so static + proxy share one tree)
        if raw == "/pulse" or raw.startswith("/pulse/"):
            stripped = raw[len("/pulse") :] or "/"
            self.path = stripped + (("?" + parsed.query) if parsed.query else "")
            parsed = urllib.parse.urlparse(self.path)
            raw = parsed.path or "/"

        path = raw.rstrip("/") or "/"

        if path in ("/proxy/yahoo", "/api/quotes"):
            return self._proxy_yahoo(parsed.query)

        # Serve index for directory roots
        if path == "/":
            self.path = "/index.html"
            return super().do_GET()

        return super().do_GET()

    def _proxy_yahoo(self, query: str) -> None:
        qs = urllib.parse.parse_qs(query)
        symbols_raw = qs.get("symbols") or qs.get("symbol") or []
        symbols: list[str] = []
        for chunk in symbols_raw:
            for part in chunk.split(","):
                s = part.strip()
                if s and s not in symbols:
                    symbols.append(s)

        if not symbols:
            body = json.dumps({"ok": False, "error": "symbols required", "quotes": []}).encode()
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self._cors()
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        spark = (qs.get("spark") or ["1"])[0] != "0"
        quotes = [fetch_symbol(s, with_spark=spark) for s in symbols]
        ok_n = sum(1 for q in quotes if q.get("ok"))
        payload = {
            "ok": ok_n > 0,
            "source": "yahoo-chart",
            "delayed": True,
            "count": len(quotes),
            "okCount": ok_n,
            "fetchedAt": time.time(),
            "quotes": quotes,
        }
        body = json.dumps(payload).encode()
        self.send_response(200 if ok_n else 502)
        self.send_header("Content-Type", "application/json")
        self._cors()
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main() -> None:
    os.chdir(ROOT)
    host = os.environ.get("HOST", "127.0.0.1")
    httpd = ThreadingHTTPServer((host, PORT), Handler)
    print(
        f"NEXUS Pulse on http://{host}:{PORT}/  (static from {ROOT})",
        flush=True,
    )
    print("  proxy: /proxy/yahoo?symbols=NVDA,SPY,QQQ", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nshutting down", flush=True)


if __name__ == "__main__":
    main()
