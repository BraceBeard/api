import { AuthenticatedRequest, authMiddleware } from "../../../../core/auth.ts";
import { router } from "../../../../core/shared/index.ts";
import { deleteLanguage } from "../functions/delete.ts";

const languagesRouteHandler = async (
  _: AuthenticatedRequest,
  params: Record<string, string | undefined>,
) => {
  const id = params.id;
  if (!id) {
    return new Response(
      JSON.stringify({ error: "The 'id' parameter is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const res = await deleteLanguage(id);
    if (!res) {
      return new Response(
        JSON.stringify({ error: "The language was not deleted" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify({ message: "The language was deleted" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "The language was not deleted" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

router.route(
  {
    pathname: "/languages/:id",
    method: "DELETE",
  },
  authMiddleware,
  languagesRouteHandler,
);
