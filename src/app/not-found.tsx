import Link from "next/link";
import { Narrow } from "@/components/chrome";

export default function NotFound() {
  return (
    <Narrow>
      <div className="grid gap-5">
        <h1 className="text-4xl font-semibold sm:text-5xl">We couldn&apos;t find that page</h1>
        <p className="text-lg text-muted">
          The link may be mistyped, or the tag was never activated. If you have a sticker, enter its code to set it
          up.
        </p>
        <div>
          <Link href="/activate" className="btn">
            Activate a tag
          </Link>
        </div>
      </div>
    </Narrow>
  );
}
