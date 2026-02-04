import { AlertTriangle, Database, ExternalLink, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DatabaseSetupGuideProps {
  missingTables: string[];
  error: string | null;
  onRetry: () => void;
}

export function DatabaseSetupGuide({ missingTables, error, onRetry }: DatabaseSetupGuideProps) {
  const allTablesMissing = missingTables.length >= 10;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <Database className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Database Setup Required</CardTitle>
          <CardDescription>
            {allTablesMissing 
              ? "Your Supabase database hasn't been set up yet."
              : "Some database tables are missing."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Connection Error</p>
                <p className="text-destructive/80">{error}</p>
              </div>
            </div>
          )}

          {!allTablesMissing && missingTables.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Missing Tables:</p>
              <div className="grid grid-cols-2 gap-2">
                {missingTables.map(table => (
                  <div key={table} className="flex items-center gap-2 text-sm">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <code className="bg-muted px-1.5 py-0.5 rounded">{table}</code>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold">Quick Setup Guide</h3>
            
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                <span>Open your Supabase project's <strong>SQL Editor</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                <span>Copy the contents of <code className="bg-muted px-1.5 py-0.5 rounded">supabase/complete_schema.sql</code></span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                <span>Paste and run the SQL in the editor</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">4</span>
                <span>Click the retry button below</span>
              </li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onRetry} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Supabase
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <p>Need help? Check the <code className="bg-muted px-1 rounded">docs/SUPABASE_SETUP.md</code> file for detailed instructions.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
