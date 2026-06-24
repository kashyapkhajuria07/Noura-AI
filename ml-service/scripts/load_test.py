import asyncio
import aiohttp
import time
import statistics
import sys

TARGET = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000/analyze"
CONCURRENCY = 100
TOTAL = 500

TEXTS = [
    "I'm feeling great about my studies this semester",
    "I can't handle the pressure anymore, it's too much",
    "The deadline is next Friday",
    "I've been sleeping badly and feel anxious",
    "I got an A on my exam!",
]

async def session():
    async with aiohttp.ClientSession() as s:
        latencies = []
        errors = 0

        async def request():
            nonlocal errors
            import random
            payload = {"text": random.choice(TEXTS)}
            start = time.perf_counter()
            try:
                async with s.post(TARGET, json=payload) as resp:
                    await resp.json()
                    latencies.append(time.perf_counter() - start)
                    if resp.status != 200:
                        errors += 1
            except Exception:
                errors += 1

        tasks = [request() for _ in range(TOTAL)]
        batches = [tasks[i:i+CONCURRENCY] for i in range(0, len(tasks), CONCURRENCY)]
        for batch in batches:
            await asyncio.gather(*batch)

        rps = TOTAL / sum(latencies) if latencies else 0
        print(f"Total requests: {TOTAL}")
        print(f"Errors: {errors}")
        print(f"RPS: {rps:.1f}")
        print(f"Mean latency: {statistics.mean(latencies)*1000:.1f}ms")
        print(f"Median latency: {statistics.median(latencies)*1000:.1f}ms")
        print(f"P99 latency: {sorted(latencies)[int(len(latencies)*0.99)]*1000:.1f}ms" if len(latencies) > 0 else "N/A")

if __name__ == "__main__":
    asyncio.run(session())
