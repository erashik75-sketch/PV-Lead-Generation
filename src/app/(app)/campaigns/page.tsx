import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SIGNATORIES } from "@/types/domain";
import { Plus, Target } from "lucide-react";
import { formatDate } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  active: "success",
  paused: "secondary",
  exhausted: "warning",
  completed: "outline",
};

export default async function CampaignsPage() {
  const supabase = await createClient();
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Campaigns</h1>
        </div>
        <Link href="/campaigns/new">
          <Button>
            <Plus className="h-4 w-4 mr-1" /> New Campaign
          </Button>
        </Link>
      </div>

      {!campaigns?.length ? (
        <Card className="text-center py-12">
          <CardContent>
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No campaigns yet. Create your first campaign to start finding leads.</p>
            <Link href="/campaigns/new">
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-1" /> Create Campaign
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((campaign) => {
            const signatory = SIGNATORIES.find((s) => s.value === campaign.assigned_signatory);
            return (
              <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{campaign.name}</CardTitle>
                      <Badge variant={STATUS_COLORS[campaign.status] as "success" | "secondary" | "outline" | "warning" ?? "secondary"}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <CardDescription>{campaign.product_category} · {campaign.target_market}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {campaign.channels?.map((ch: string) => (
                        <span key={ch} className="text-xs bg-muted px-2 py-0.5 rounded-full">{ch}</span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Signatory: {signatory?.name ?? campaign.assigned_signatory} · Created {formatDate(campaign.created_at)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
