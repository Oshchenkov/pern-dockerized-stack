import { NextRequest } from "next/server";
import { comments } from "@/app/api/v1/comments/data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const comment = comments.find((c) => c.id === parseInt(id));
  if (!comment) {
    return new Response(JSON.stringify({ error: "Comment not found" }), {
      headers: { "Content-Type": "application/json" },
      status: 404,
    });
  }
  return new Response(JSON.stringify(comment), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const commentIndex = comments.findIndex((c) => c.id === parseInt(id));
  if (commentIndex === -1) {
    return new Response(JSON.stringify({ error: "Comment not found" }), {
      headers: { "Content-Type": "application/json" },
      status: 404,
    });
  }
  const updatedData = await request.json();

  comments[commentIndex] = { ...comments[commentIndex], ...updatedData };
  return new Response(JSON.stringify(comments[commentIndex]), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const commentIndex = comments.findIndex((c) => c.id === parseInt(id));
  if (commentIndex === -1) {
    return new Response(JSON.stringify({ error: "Comment not found" }), {
      headers: { "Content-Type": "application/json" },
      status: 404,
    });
  }
  const deletedEl = comments[commentIndex];
  comments.splice(commentIndex, 1);
  return new Response(JSON.stringify({ deleted: deletedEl, all: comments }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}
