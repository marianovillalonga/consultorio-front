import { Suspense } from "react";
import ResetClient from "./ResetClient";

export default function ResetPage() {
  return (
    <section className="auth-hero">
      <Suspense>
        <ResetClient />
      </Suspense>
    </section>
  );
}
