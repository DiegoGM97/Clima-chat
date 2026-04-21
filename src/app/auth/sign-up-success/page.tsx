import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {
  return (
    <main className="sky-page flex items-center justify-center p-6 md:p-10">
      <div className="sky-page-content w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card className="sky-card">
            <CardHeader>
              <CardTitle className="text-2xl">
                Gracias por registrarte
              </CardTitle>
              <CardDescription>
                Revisa tu correo para confirmar tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Tu registro fue exitoso. Verifica tu correo antes de iniciar
                sesion.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
