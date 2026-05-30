import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { deleteTable, fetchTables, insertTable, updateTable } from "@/lib/supabase/crud";

interface TableRequest {
  id?: number | string;
  table_number?: number | string;
}

function normalizeTable(body: TableRequest) {
  return {
    table_number: Number(body.table_number),
  };
}

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }

    const tables = await fetchTables();
    return NextResponse.json({ tables });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to load tables", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }

    const table = normalizeTable((await request.json()) as TableRequest);

    if (!Number.isInteger(table.table_number) || table.table_number <= 0) {
      return NextResponse.json({ error: "Valid table number is required" }, { status: 400 });
    }

    const created = await insertTable(table);
    return NextResponse.json({ table: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to create table", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }

    const body = (await request.json()) as TableRequest;
    const id = Number(body.id);
    const table = normalizeTable(body);

    if (!id) {
      return NextResponse.json({ error: "Table id is required" }, { status: 400 });
    }

    if (!Number.isInteger(table.table_number) || table.table_number <= 0) {
      return NextResponse.json({ error: "Valid table number is required" }, { status: 400 });
    }

    const updated = await updateTable(id, table);

    if (!updated) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    return NextResponse.json({ table: updated });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to update table", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!id) {
      return NextResponse.json({ error: "Table id is required" }, { status: 400 });
    }

    await deleteTable(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to delete table", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
