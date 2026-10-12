#!/usr/bin/env python3
"""Read a CSV and insert each row into a Postgres table.

Columns come from the CSV header, so the header must match the table's
column names.

Usage:
    DATABASE_URL=postgresql://user:pass@host:5432/db \
        python scripts/csv_to_postgres.py data.csv my_table
"""

import argparse
import csv
import os
import sys

import psycopg2


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv_path", help="Path to the CSV file")
    parser.add_argument("table", help="Target table name")
    parser.add_argument(
        "--dsn",
        default=os.environ.get("DATABASE_URL"),
        help="Postgres connection string (defaults to $DATABASE_URL)",
    )
    parser.add_argument("--batch", type=int, default=500, help="Rows per INSERT")
    args = parser.parse_args()

    if not args.dsn:
        print("error: no DSN; pass --dsn or set DATABASE_URL", file=sys.stderr)
        return 1

    with open(args.csv_path, newline="") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames:
            print("error: CSV has no header row", file=sys.stderr)
            return 1
        columns = reader.fieldnames

        # psycopg2 binds values only, not identifiers: quote columns inline.
        col_sql = ", ".join('"' + c + '"' for c in columns)
        placeholders = ", ".join(["%s"] * len(columns))
        insert_sql = 'INSERT INTO "' + args.table + '" (' + col_sql + ") VALUES (" + placeholders + ")"

        inserted = 0
        conn = psycopg2.connect(args.dsn)
        try:
            with conn, conn.cursor() as cur:
                batch = []
                for row in reader:
                    batch.append(tuple(row[c] for c in columns))
                    if len(batch) >= args.batch:
                        cur.executemany(insert_sql, batch)
                        inserted += len(batch)
                        batch = []
                if batch:
                    cur.executemany(insert_sql, batch)
                    inserted += len(batch)
        except Exception as exc:
            print("error: " + str(exc), file=sys.stderr)
            print("rolled back; " + str(inserted) + " rows already committed in earlier batches", file=sys.stderr)
            return 1
        finally:
            conn.close()

    print("inserted " + str(inserted) + " rows into " + args.table)
    return 0


if __name__ == "__main__":
    sys.exit(main())
