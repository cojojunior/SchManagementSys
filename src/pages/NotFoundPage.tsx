import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="text-center space-y-3">
        <div className="text-5xl font-bold text-ink-300">404</div>
        <p className="text-ink-600">That page doesn't exist.</p>
        <Link to="/login">
          <Button>Back to sign in</Button>
        </Link>
      </div>
    </div>
  );
}
