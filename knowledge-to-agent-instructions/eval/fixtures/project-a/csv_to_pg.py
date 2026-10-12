#!/usr/bin/env python3
"""Insert every row of a CSV into a Postgres table.

Usage: DATABASE_URL=postgres://... python3 csv_to_pg.py data.csv table_name
"""
import csv
import os
import re
import sys

IDENT = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def insert_sql(table, columns):
    assert IDENT.match(table), f"bad table name: {table}"
    assert all(IDENT.match(c) for c in columns), f"bad column name in {columns}"
    cols = ", ".join(columns)
    ph = ", ".join(["%s"] * len(columns))
    return f"INSERT INTO {table} ({cols}) VALUES ({ph})"


def rows(path):
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        assert reader.fieldnames, f"empty CSV: {path}"
        return reader.fieldnames, [tuple(r[c] for c in reader.fieldnames) for r in reader]


def main(argv):
    import psycopg  # pip install "psycopg[binary]"

    if len(argv) != 3:
        sys.exit(__doc__)
    path, table = argv[1], argv[2]
    columns, data = rows(path)
    with psycopg.connect(os.environ["DATABASE_URL"]) as conn:
        with conn.cursor() as cur:
            cur.executemany(insert_sql(table, columns), data)
    print(f"inserted {len(data)} rows into {table}")


def _check():
    assert insert_sql("users", ["id", "email"]) == (
        "INSERT INTO users (id, email) VALUES (%s, %s)"
    )
    try:
        insert_sql("users; DROP TABLE x", ["id"])
    except AssertionError:
        pass
    else:
        raise SystemExit("identifier check failed")
    print("ok")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--selftest":
        _check()
    else:
        main(sys.argv)
