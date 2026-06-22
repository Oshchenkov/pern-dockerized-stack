import { createFileRoute } from "@tanstack/react-router";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute(
  "/_rootLayout/_unauthenticated/_auth/signin",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          console.log(e);
        }}
        className="h-full"
      >
        <FieldSet className="w-full h-full flex justify-center items-center ">
          <div className="w-full max-w-sm  ">
            <div className="mb-4 text-center">
              <FieldLegend className="mb-4">Sign In</FieldLegend>
              <FieldDescription className="text-center">
                Enter your credentions to sign in
              </FieldDescription>
            </div>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input id="username" type="text" placeholder="Max Leiter" />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input id="password" type="password" placeholder="••••••••" />
              </Field>
            </FieldGroup>

            <FieldGroup className="mt-8">
              <Button type="submit">Submit</Button>
            </FieldGroup>
          </div>
        </FieldSet>
      </form>
    </>
  );
}
