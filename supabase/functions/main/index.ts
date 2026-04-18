console.log("main function started");

Deno.serve(async (req: Request) => {
  const { pathname } = new URL(req.url);
  const [serviceName] = pathname.split("/").filter(Boolean);

  if (!serviceName) {
    return new Response(JSON.stringify({ error: "Missing function name in request path" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const worker = await EdgeRuntime.userWorkers.create({
      servicePath: `/home/deno/functions/${serviceName}`,
      memoryLimitMb: 150,
      workerTimeoutMs: 60_000,
      noModuleCache: false,
      importMapPath: null,
      envVars: Object.entries(Deno.env.toObject()),
    });

    return await worker.fetch(req);
  } catch (error) {
    console.error(`Failed to serve function ${serviceName}:`, error);

    return new Response(JSON.stringify({ error: `Failed to start function ${serviceName}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
