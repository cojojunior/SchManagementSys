import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function StudentReportPage() {
  return (
    <>
      <PageHeader
        title="My Report Card"
        description="Terminal report cards are available after results are unlocked"
      />
      <Card>
        <CardBody>
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title="Unlock your results first"
            description="Enter a valid scratch card PIN on the results page to view and download your report card."
            action={
              <Link to="/student/results">
                <Button>Go to results</Button>
              </Link>
            }
          />
        </CardBody>
      </Card>
    </>
  );
}
