'use client';

import React, { useState } from "react";
import { Button } from "../../components/ui/Button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";
import Input from "../../components/ui/Input";
import type { Route } from "next";
import Link from "next/link";
import {
  FieldValues,
  SubmitHandler,
  useForm,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { loginSchema } from "../loginValidation";
import { loginUser } from "@/services/AuthService";
import { getClientToken, setClientToken } from "../../lib/tokenUtils";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useI18n } from "../../components/i18n/LanguageProvider";

interface LoginFormProps {
  isLogin: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ isLogin }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useI18n();

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const {
    formState: { isSubmitting },
  } = form;

  const submitLabel = t("loginSubmit");
  const processingLabel = t("loginProcessing");

  const onSubmit: SubmitHandler<FieldValues> = async (data) => {
    const newdata = {
      identifier: data.identifier,
      password: data.password,
    };

   // console.log(newdata);

    try {
      const res = await loginUser(newdata);
     // console.log("Login response:", res);
     // console.log("Login response data:", res.data);
    //  console.log("Access token:", res.data?.accessToken);
//console.log(res);
      if (res?.success) {
        if (res.data?.accessToken) {
        //  console.log(res);
          setClientToken(res.data.accessToken);
        } else {
          console.error("No access token in response data");
        }

        const redirectPathParam =
          searchParams.get("redirectPath") ?? searchParams.get("next");
        // Determine role from JWT (client-side decode of payload)
        let role: string | undefined;
        try {
          const token = res.data?.accessToken || getClientToken();
          if (token && token.split(".").length === 3) {
            const payload = JSON.parse(
              atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
            );
            role = payload?.role;
          }
        } catch {}

        // Honor explicit redirect param; otherwise role-based default
        const targetPathString =
          redirectPathParam && redirectPathParam.startsWith("/")
            ? redirectPathParam
            : role === "admin" || role === "editor"
              ? "/dashboard"
              : "/profile";
        const targetPath = targetPathString as Route;
       // console.log("Login successful!");
       // console.log("Redirect path from URL:", redirectPathParam);
       // console.log("Target path:", targetPathString);
       // console.log("Current URL:", window.location.href);
       // console.log("Redirecting to:", targetPath);
        try {
          // Notify app that auth state changed so navbar updates immediately
          window.dispatchEvent(new CustomEvent("auth-change"));
        } catch {}
        // auth-change event already dispatched via setClientToken/removeClientToken utilities
        router.push(targetPath);
        router.refresh();
        toast.success(res?.message);
      } else {
        toast.error(res?.message);
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error("Login failed. Please try again.");
    }
  };

  return (
    <Form {...form}>
      <div className="space-y-2 text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          {t("loginPageTitle")}
        </h1>
        <p className="text-base text-gray-600">
          {t("loginPageSubtitle")}
        </p>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="identifier"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base text-gray-800">
                {t("loginIdentifierLabel")}
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                  <Input
                    type="text"
                    placeholder={t("loginIdentifierPlaceholder")}
                    className="rounded-xl border-gray-300 py-6 pl-12 text-base focus:border-teal-500 focus:ring-teal-500"
                    {...field}
                    value={field.value || ""}
                    autoComplete="username"
                  />
                </div>
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
              <FormLabel className="text-base text-gray-800">
                {t("loginPasswordLabel")}
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={t("loginPasswordPlaceholder")}
                    className="rounded-xl border-gray-300 py-6 pl-12 pr-14 text-base focus:border-teal-500 focus:ring-teal-500"
                    {...field}
                    value={field.value || ""}
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2 transform p-0 hover:bg-transparent"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword
                        ? t("loginHidePassword")
                        : t("loginShowPassword")
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between text-sm -mt-2">
          <Link href="/forgot-password" className="text-teal-600 hover:text-teal-700">
            {t("loginForgotPassword")}
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-6 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:from-emerald-600 hover:to-teal-700 hover:shadow-xl"
        >
          {isSubmitting ? processingLabel : submitLabel}
        </Button>
      </form>
    </Form>
  );
};

export default LoginForm;
