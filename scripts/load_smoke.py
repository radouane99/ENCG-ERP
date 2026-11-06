"""Bounded, read-only HTTP load probe. Defaults to localhost, never sends credentials."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import json
import math
import time
from urllib.error import HTTPError
from urllib.parse import urlsplit
from urllib.request import Request, build_opener, HTTPRedirectHandler


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def validate(args):
    url = urlsplit(args.url)
    if url.scheme not in ('http', 'https') or url.username or url.password or url.query or url.fragment:
        raise ValueError('Use an HTTP URL without credentials, query or fragment.')
    if url.hostname not in ('localhost', '127.0.0.1', '::1'):
        raise ValueError('This smoke probe only targets localhost. Use a reviewed load plan for remote hosts.')
    if url.path not in ('/api/health/ready', '/up'):
        raise ValueError('Only read-only readiness paths are permitted.')
    if not 1 <= args.requests <= 200 or not 1 <= args.workers <= 8:
        raise ValueError('Limits: 1–200 requests, 1–8 workers.')


def run(args):
    validate(args)

    def request(_):
        start = time.perf_counter()
        good = False
        try:
            opener = build_opener(NoRedirect())
            with opener.open(Request(args.url, headers={'Accept': 'application/json'}), timeout=10) as response:
                body = response.read(65536)
                good = response.status == 200
                if urlsplit(args.url).path == '/api/health/ready':
                    good = good and json.loads(body).get('ready') is True
        except (OSError, HTTPError, ValueError):
            pass
        return good, time.perf_counter() - start

    started = time.perf_counter()
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        results = list(pool.map(request, range(args.requests)))
    durations = sorted(elapsed for _, elapsed in results)
    summary = {'requests': args.requests, 'workers': args.workers,
               'failures': sum(not good for good, _ in results),
               'p95_seconds': round(durations[math.ceil(len(durations) * .95) - 1], 3),
               'elapsed_seconds': round(time.perf_counter() - started, 3)}
    print(json.dumps(summary))
    return 1 if summary['failures'] or summary['p95_seconds'] > args.max_p95 else 0


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', default='http://127.0.0.1/api/health/ready')
    parser.add_argument('--requests', type=int, default=30)
    parser.add_argument('--workers', type=int, default=3)
    parser.add_argument('--max-p95', type=float, default=3)
    try:
        raise SystemExit(run(parser.parse_args()))
    except ValueError as error:
        parser.error(str(error))
