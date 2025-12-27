import { createClient } from '@/lib/supabase/server'
import { Button } from '@repo/ui/components/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@repo/ui/components/card'
import { Input } from '@repo/ui/components/input'
import { Field, FieldLabel, FieldError, FieldSeparator } from '@repo/ui/components/field'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Loader2, Mail, Lock, AlertCircle, Check } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMemo, useRef, useEffect } from 'react'
import { type ActionFunctionArgs, Link, redirect, useFetcher, useSearchParams } from 'react-router'
import { toast } from 'sonner'

const PASSWORD_MIN_LENGTH = 8

const signUpSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignUpFormData = z.infer<typeof signUpSchema>

function validatePasswordStrength(password: string) {
  const checks = {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  }
  const strength = Object.values(checks).filter(Boolean).length
  return { checks, strength }
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { supabase, headers } = createClient(request)
  const url = new URL(request.url)
  const origin = url.origin
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'google') {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${origin}/oauth?next=/` },
    })

    if (error) return { error: error.message }
    if (data.url) return redirect(data.url, { headers })
    return { error: 'Failed to initiate Google sign-in' }
  }

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/` },
  })

  if (error) return { error: error.message }
  return redirect('/sign-up?success')
}

export default function SignUp() {
  const fetcher = useFetcher<typeof action>()
  const [searchParams] = useSearchParams()
  const prefersReducedMotion = useReducedMotion()
  const formRef = useRef<HTMLFormElement>(null)

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
    mode: 'onBlur',
  })

  const password = form.watch('password')
  const passwordValidation = useMemo(() => validatePasswordStrength(password || ''), [password])

  const success = searchParams.has('success')
  const serverError = fetcher.data?.error
  const loading = fetcher.state === 'submitting'

  useEffect(() => {
    if (serverError) {
      toast.error('Sign up failed', {
        description: serverError,
      })
    }
  }, [serverError])

  useEffect(() => {
    if (success) {
      toast.success('Sign up successful', {
        description: 'Please check your email to confirm your account.',
      })
    }
  }, [success])

  const cardVariants = prefersReducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 } }

  return (
    <motion.div
      {...cardVariants}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4, ease: "easeOut" }}
      className="w-full"
    >
      <Card className="border-white/[0.15] bg-zinc-900/40 backdrop-blur-2xl shadow-2xl shadow-black/50 overflow-hidden ring-1 ring-white/5">
        {success ? (
          <div className="flex flex-col items-center justify-center p-8 text-center" role="status">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/20">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" aria-hidden="true" />
            </div>
            <CardHeader className="p-0 mb-4">
              <CardTitle className="font-serif text-2xl font-light text-white tracking-tight">Check your email</CardTitle>
              <CardDescription className="text-zinc-400">We've sent a confirmation link to your email address.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-sm text-zinc-500 max-w-xs mx-auto mb-6">
                Please check your inbox (and spam folder) to confirm your account.
              </p>
              <Link to="/login">
                <Button variant="outline" className="border-white/10 hover:bg-white/5 hover:text-white">Return to Login</Button>
              </Link>
            </CardContent>
          </div>
        ) : (
          <>
            <CardHeader className="space-y-1 pb-6 pt-8 text-center">
              <CardTitle className="font-serif text-2xl font-light text-white tracking-tight">Create an account</CardTitle>
              <CardDescription className="text-zinc-400">Start your wealth tracking journey</CardDescription>
            </CardHeader>
            <CardContent className="pb-8 px-8">
              {/* Google OAuth */}
              <fetcher.Form method="post" className="mb-6">
                <input type="hidden" name="intent" value="google" />
                <Button type="submit" variant="outline" className="relative w-full h-11 border-white/10 bg-white/5 text-white hover:bg-white/10 group" disabled={loading}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-emerald-500/10 to-transparent" />
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {loading ? 'Connecting...' : 'Sign up with Google'}
                </Button>
              </fetcher.Form>

              <FieldSeparator className="my-6">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">Or continue with email</span>
              </FieldSeparator>

              {/* Email/Password Form */}
              <fetcher.Form 
                ref={formRef}
                method="post" 
                onSubmit={(e) => {
                  e.preventDefault()
                  form.handleSubmit((data) => {
                    // After validation passes, submit with validated data
                    const formData = new FormData()
                    formData.set('email', data.email)
                    formData.set('password', data.password)
                    fetcher.submit(formData, { method: 'post' })
                  })(e)
                }} 
                className="space-y-4"
              >

                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="signup-email" className="text-zinc-400 font-normal">Email</FieldLabel>
                      <div className="relative">
                        <Input {...field} id="signup-email" type="email" placeholder="name@example.com" autoComplete="email" aria-invalid={fieldState.invalid} className="pl-10 h-11 border-white/10 bg-white/5 text-white placeholder:text-zinc-600 focus:bg-zinc-900/50 focus:border-emerald-500/50" />
                        <Mail className="absolute left-3 top-3 h-5 w-5 text-zinc-600 pointer-events-none" aria-hidden="true" />
                      </div>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="signup-password" className="text-zinc-400 font-normal">Password</FieldLabel>
                      <div className="relative">
                        <Input {...field} id="signup-password" type="password" autoComplete="new-password" aria-invalid={fieldState.invalid} aria-describedby="password-requirements" className="pl-10 h-11 border-white/10 bg-white/5 text-white placeholder:text-zinc-600 focus:bg-zinc-900/50 focus:border-emerald-500/50" />
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-zinc-600 pointer-events-none" aria-hidden="true" />
                      </div>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      {password && (
                        <div id="password-requirements" className="space-y-2 pt-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4].map((level) => (
                              <div key={level} className={`h-1 flex-1 rounded-full transition-colors ${passwordValidation.strength >= level ? (level <= 2 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-white/10'}`} />
                            ))}
                          </div>
                          <ul className="text-xs space-y-1">
                            <li className={`flex items-center gap-1.5 ${passwordValidation.checks.minLength ? 'text-emerald-400' : 'text-zinc-500'}`}>
                              {passwordValidation.checks.minLength ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                              At least {PASSWORD_MIN_LENGTH} characters
                            </li>
                            <li className={`flex items-center gap-1.5 ${passwordValidation.checks.hasUppercase && passwordValidation.checks.hasLowercase ? 'text-emerald-400' : 'text-zinc-500'}`}>
                              {passwordValidation.checks.hasUppercase && passwordValidation.checks.hasLowercase ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                              Upper & lowercase letters
                            </li>
                            <li className={`flex items-center gap-1.5 ${passwordValidation.checks.hasNumber ? 'text-emerald-400' : 'text-zinc-500'}`}>
                              {passwordValidation.checks.hasNumber ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                              At least one number
                            </li>
                          </ul>
                        </div>
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="confirmPassword"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="signup-confirm" className="text-zinc-400 font-normal">Confirm Password</FieldLabel>
                      <div className="relative">
                        <Input {...field} id="signup-confirm" type="password" autoComplete="new-password" aria-invalid={fieldState.invalid} className="pl-10 h-11 border-white/10 bg-white/5 text-white placeholder:text-zinc-600 focus:bg-zinc-900/50 focus:border-emerald-500/50" />
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-zinc-600 pointer-events-none" aria-hidden="true" />
                      </div>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                {serverError && (
                  <div role="alert" aria-live="polite" className="rounded-md bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-sm text-rose-400">
                    {serverError}
                  </div>
                )}

                <Button type="submit" className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-900/20 mt-2" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : (
                    <span className="flex items-center justify-center">Create Account <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></span>
                  )}
                </Button>
              </fetcher.Form>

              <div className="mt-6 text-center text-sm text-zinc-500">
                Already have an account?{' '}
                <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">Sign in</Link>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </motion.div>
  )
}
