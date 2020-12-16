let config = {};

if (Deno.env.get('DATABASE_URL')) {
  config.database = Deno.env.get('DATABASE_URL');
} else {
  config.database = {};
}

export { config }; 