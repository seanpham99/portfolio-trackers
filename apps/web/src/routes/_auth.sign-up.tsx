import { createClient } from '@/lib/supabase/server'
import { Button } from '@repo/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import { type ActionFunctionArgs, Link, redirect, useFetcher, useSearchParams } from 'react-router'

export const action = async ({ request }: ActionFunctionArgs) => {
  const { supabase, headers } = createClient(request)
  const url = new URL(request.url)
  const origin = url.origin
  const formData = await request.formData()
  const intent = formData.get('intent')

  // Google OAuth flow
  if (intent === 'google') {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/oauth?next=/`,
      },
    })

    if (error) {
      return { error: error.message }
    }

    if (data.url) {
      return redirect(data.url, { headers })
    }

    return { error: 'Failed to initiate Google sign-in' }
  }

  // Email/password sign-up flow
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const repeatPassword = formData.get('repeat-password') as string

  if (!password) {
    return {
      error: 'Password is required',
    }
  }

  if (password !== repeatPassword) {
    return { error: 'Passwords do not match' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return redirect('/sign-up?success')
}

export default function SignUp() {
  const fetcher = useFetcher<typeof action>()
  let [searchParams] = useSearchParams()

  const success = !!searchParams.has('success')
  const error = fetcher.data?.error
  const loading = fetcher.state === 'submitting'

  return (
    <div className="w-full">
      {success ? (
        <Card className="border-white/[0.08] bg-zinc-900/95 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="font-serif text-2xl font-light text-white">Thank you for signing up!</CardTitle>
            <CardDescription className="text-zinc-400">Check your email to confirm</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-400">
              You&apos;ve successfully signed up. Please check your email to confirm your
              account before signing in.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-white/[0.08] bg-zinc-900/95 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="font-serif text-2xl font-light text-white">Create an account</CardTitle>
            <CardDescription className="text-zinc-400">Get started with your portfolio tracking</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Google OAuth Button */}
            <fetcher.Form method="post">
              <input type="hidden" name="intent" value="google" />
              <Button
                type="submit"
                variant="outline"
                className="w-full border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.08]"
                disabled={loading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {loading ? 'Signing up...' : 'Sign up with Google'}
              </Button>
            </fetcher.Form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/[0.08]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-900 px-2 text-zinc-500">Or continue with email</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <fetcher.Form method="post">
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-sm text-zinc-400">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    className="border-white/[0.08] bg-white/[0.03] text-white placeholder:text-zinc-600"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-sm text-zinc-400">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="border-white/[0.08] bg-white/[0.03] text-white"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="repeat-password" className="text-sm text-zinc-400">Confirm Password</Label>
                  <Input
                    id="repeat-password"
                    name="repeat-password"
                    type="password"
                    required
                    className="border-white/[0.08] bg-white/[0.03] text-white"
                  />
                </div>
                {error && <p className="text-sm text-rose-400">{error}</p>}
                <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create account'}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm text-zinc-400">
                Already have an account?{' '}
                <Link to="/login" className="text-emerald-400 underline-offset-4 hover:underline">
                  Login
                </Link>
              </div>
            </fetcher.Form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
