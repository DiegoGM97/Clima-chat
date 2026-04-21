import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;
  const errorCode = params?.error ? decodeURIComponent(params.error) : null;

  return (
    <main className="sky-page flex items-center justify-center p-6 md:p-10">
      <div className="sky-page-content w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card className="sky-card">
            <CardHeader>
              <CardTitle className="text-2xl">Ocurrio un problema</CardTitle>
            </CardHeader>
            <CardContent>
              {errorCode ? (
                <p className="text-sm text-muted-foreground">
                  No pudimos completar la accion de autenticacion. Codigo:{" "}
                  {errorCode}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Ocurrio un error no especificado al procesar tu acceso.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
