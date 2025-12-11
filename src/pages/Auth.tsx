import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FlaskConical } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const authSchema = z.object({
  username: z
    .string()
    .min(3, "Kullanıcı adı en az 3 karakter olmalıdır")
    .max(30, "Kullanıcı adı 30 karakterden az olmalıdır")
    .regex(/^[a-zA-Z0-9_]+$/, "Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir"),
  password: z
    .string()
    .min(6, "Şifre en az 6 karakter olmalıdır")
    .max(72, "Şifre 72 karakterden az olmalıdır"),
});

type AuthFormData = z.infer<typeof authSchema>;

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, isAuthenticated, loading } = useAuth();
  const { toast } = useToast();

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const onSubmit = async (data: AuthFormData) => {
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(data.username, data.password);
        if (error) {
          toast({
            variant: "destructive",
            title: "Giriş Başarısız",
            description: error.message,
          });
        } else {
          toast({
            title: "Tekrar hoş geldiniz!",
            description: "Başarıyla giriş yaptınız.",
          });
          navigate("/dashboard", { replace: true });
        }
      } else {
        const { error } = await signUp(data.username, data.password);
        if (error) {
          toast({
            variant: "destructive",
            title: "Kayıt Başarısız",
            description: error.message,
          });
        } else {
          toast({
            title: "Hesap oluşturuldu!",
            description: "Artık deney oluşturmaya başlayabilirsiniz.",
          });
          navigate("/dashboard", { replace: true });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary text-primary-foreground mb-4">
            <FlaskConical className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Araştırma Platformu</h1>
          <p className="text-muted-foreground mt-1">Davranışsal deney oluşturucu</p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">
              {isLogin ? "Tekrar hoş geldiniz" : "Hesap oluşturun"}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? "Deneylerinize erişmek için bilgilerinizi girin"
                : "Araştırma platformunuzla başlayın"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kullanıcı Adı</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Kullanıcı adınızı girin"
                          autoComplete="username"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Şifre</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Şifrenizi girin"
                          autoComplete={isLogin ? "current-password" : "new-password"}
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLogin ? "Giriş Yap" : "Hesap Oluştur"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  form.reset();
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isLogin
                  ? "Hesabınız yok mu? Kayıt olun"
                  : "Zaten hesabınız var mı? Giriş yapın"}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Devam ederek, etik araştırma yapmayı kabul etmiş olursunuz.
        </p>
      </div>
    </div>
  );
}
