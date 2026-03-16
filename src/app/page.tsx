import { randomUUID } from "crypto";
import { redirect } from "next/navigation";

export default function Home() {
  redirect(`/chat/${randomUUID()}`);
}
