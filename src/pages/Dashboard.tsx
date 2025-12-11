import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { generateCSV, downloadCSV } from "@/lib/csvExport";
import {
  FlaskConical,
  Plus,
  LogOut,
  FileText,
  Users,
  Calendar,
  MoreVertical,
  Trash2,
  ExternalLink,
  Copy,
  Loader2,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Experiment {
  id: string;
  title: string;
  status: "draft" | "active" | "closed";
  created_at: string;
  updated_at: string;
  result_count?: number;
}

interface BlockResult {
  blockId: string;
  blockType: string;
  data: Record<string, unknown>;
  completedAt: number;
}

export default function Dashboard() {
  const { user, username, signOut, loading: authLoading, isAuthenticated } = useAuth();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch experiments with result counts
  useEffect(() => {
    if (user) {
      fetchExperiments();
    }
  }, [user]);

  const fetchExperiments = async () => {
    try {
      // Fetch experiments
      const { data: experimentsData, error: experimentsError } = await supabase
        .from("experiments")
        .select("*")
        .order("updated_at", { ascending: false });

      if (experimentsError) throw experimentsError;

      // Fetch result counts for each experiment
      const experimentsWithCounts = await Promise.all(
        (experimentsData || []).map(async (exp) => {
          const { count, error: countError } = await supabase
            .from("results")
            .select("*", { count: "exact", head: true })
            .eq("experiment_id", exp.id);

          return {
            id: exp.id,
            title: exp.title,
            status: exp.status as "draft" | "active" | "closed",
            created_at: exp.created_at,
            updated_at: exp.updated_at,
            result_count: countError ? 0 : (count || 0),
          };
        })
      );

      setExperiments(experimentsWithCounts);
    } catch (error) {
      console.error("Error fetching experiments:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load experiments.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const handleCreateExperiment = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("experiments")
        .insert({
          title: "Untitled Experiment",
          owner_id: user.id,
          config: [],
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Experiment created",
        description: "Start building your experiment.",
      });

      navigate(`/builder/${data.id}`);
    } catch (error) {
      console.error("Error creating experiment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create experiment.",
      });
    }
  };

  const handleDeleteExperiment = async (id: string) => {
    try {
      const { error } = await supabase
        .from("experiments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setExperiments((prev) => prev.filter((e) => e.id !== id));
      toast({
        title: "Experiment deleted",
        description: "The experiment has been removed.",
      });
    } catch (error) {
      console.error("Error deleting experiment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete experiment.",
      });
    }
  };

  const handleExportResults = async (experiment: Experiment) => {
    setExportingId(experiment.id);

    try {
      const { data: results, error } = await supabase
        .from("results")
        .select("*")
        .eq("experiment_id", experiment.id)
        .order("completed_at", { ascending: true });

      if (error) throw error;

      if (!results || results.length === 0) {
        toast({
          title: "No results",
          description: "This experiment has no results to export.",
        });
        return;
      }

      // Transform results for CSV generation
      const formattedResults = results.map((r) => ({
        id: r.id,
        data_json: r.data_json as unknown as BlockResult[],
        completed_at: r.completed_at,
      }));

      const csv = generateCSV(experiment.id, experiment.title, formattedResults);
      const filename = `${experiment.title.replace(/[^a-z0-9]/gi, "_")}_results_${new Date().toISOString().split("T")[0]}.csv`;
      
      downloadCSV(csv, filename);

      toast({
        title: "Export complete",
        description: `Downloaded ${results.length} result${results.length !== 1 ? "s" : ""}.`,
      });
    } catch (error) {
      console.error("Error exporting results:", error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Could not export results. Please try again.",
      });
    } finally {
      setExportingId(null);
    }
  };

  const copyRunLink = (id: string) => {
    const url = `${window.location.origin}/run/${id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "Participant link copied to clipboard.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success/10 text-success border-success/20";
      case "closed":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-warning/10 text-warning border-warning/20";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Research Platform</h1>
              <p className="text-xs text-muted-foreground">Logged in as {username}</p>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">My Experiments</h2>
            <p className="text-muted-foreground mt-1">
              Create and manage your behavioral research experiments
            </p>
          </div>

          <Button onClick={handleCreateExperiment}>
            <Plus className="h-4 w-4 mr-2" />
            New Experiment
          </Button>
        </div>

        {experiments.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-muted mb-4">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No experiments yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Create your first experiment to start collecting behavioral research data.
              </p>
              <Button onClick={handleCreateExperiment}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Experiment
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {experiments.map((experiment) => (
              <Card
                key={experiment.id}
                className="group hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/builder/${experiment.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-medium truncate">
                        {experiment.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(experiment.updated_at)}
                      </CardDescription>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/run/${experiment.id}`, "_blank");
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            copyRunLink(experiment.id);
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportResults(experiment);
                          }}
                          disabled={exportingId === experiment.id || (experiment.result_count || 0) === 0}
                        >
                          {exportingId === experiment.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          Download Results
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteExperiment(experiment.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getStatusColor(experiment.status)}>
                        {experiment.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">
                        {experiment.result_count || 0} response{(experiment.result_count || 0) !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
