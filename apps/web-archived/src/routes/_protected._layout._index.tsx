import { redirect } from "react-router";

export async function loader() {
  return redirect("/dashboard");
}

export default function Home() {
  // This should never render due to the loader redirect
  return null;
}
