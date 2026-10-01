// Local transformations for the catalogue tools. Currency rates are the only live external service.
const numberList = (text, count) => {
  const values = text
    .split(/[\s,;]+/)
    .filter(Boolean)
    .map(Number);
  if (
    values.length < count ||
    values.slice(0, count).some((value) => !Number.isFinite(value))
  ) {
    throw new Error(
      `Enter ${count} valid number${count === 1 ? "" : "s"}, separated by commas.`,
    );
  }
  return values;
};
const units = {
  Length: {
    m: 1,
    meter: 1,
    meters: 1,
    km: 1000,
    cm: 0.01,
    mm: 0.001,
    mi: 1609.344,
    mile: 1609.344,
    miles: 1609.344,
    ft: 0.3048,
    feet: 0.3048,
    in: 0.0254,
    inch: 0.0254,
    inches: 0.0254,
  },
  Weight: {
    kg: 1,
    kilogram: 1,
    g: 0.001,
    gram: 0.001,
    grams: 0.001,
    mg: 0.000001,
    lb: 0.45359237,
    lbs: 0.45359237,
    pound: 0.45359237,
    oz: 0.028349523125,
  },
  Area: {
    m2: 1,
    "m²": 1,
    km2: 1e6,
    "km²": 1e6,
    ft2: 0.09290304,
    "ft²": 0.09290304,
    acre: 4046.8564224,
    acres: 4046.8564224,
    ha: 10000,
    hectare: 10000,
    hectares: 10000,
  },
  "Data Storage": {
    B: 1,
    byte: 1,
    bytes: 1,
    KB: 1e3,
    MB: 1e6,
    GB: 1e9,
    TB: 1e12,
    KiB: 1024,
    MiB: 1024 ** 2,
    GiB: 1024 ** 3,
    TiB: 1024 ** 4,
  },
  Time: {
    s: 1,
    sec: 1,
    second: 1,
    seconds: 1,
    min: 60,
    minute: 60,
    minutes: 60,
    h: 3600,
    hr: 3600,
    hour: 3600,
    hours: 3600,
    d: 86400,
    day: 86400,
    days: 86400,
  },
};
const prettify = (value) => Number(value.toPrecision(10)).toString();
const titleCase = (text) =>
  text.toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());

export async function runTool(name, input, signal) {
  const value = input.trim();
  const args = value.split(/[\s,;]+/).filter(Boolean);
  switch (name) {
    case "Percentage": {
      const [amount, rate] = numberList(value, 2);
      return `${rate}% of ${amount} = ${prettify((amount * rate) / 100)}\nIncrease by ${rate}% = ${prettify(amount * (1 + rate / 100))}\nDecrease by ${rate}% = ${prettify(amount * (1 - rate / 100))}`;
    }
    case "EMI":
    case "Loan": {
      const [principal, annualRate, months] = numberList(value, 3);
      if (principal <= 0 || months <= 0 || annualRate < 0)
        throw new Error(
          "Use a positive principal and term, with a non-negative annual rate.",
        );
      const monthlyRate = annualRate / 1200;
      const payment =
        monthlyRate === 0
          ? principal / months
          : (principal * monthlyRate * (1 + monthlyRate) ** months) /
            ((1 + monthlyRate) ** months - 1);
      return `Monthly payment: ${prettify(payment)}\nTotal paid: ${prettify(payment * months)}\nTotal interest: ${prettify(payment * months - principal)}`;
    }
    case "GST": {
      const [amount, rate] = numberList(value, 2);
      return `GST amount: ${prettify((amount * rate) / 100)}\nTotal including GST: ${prettify(amount * (1 + rate / 100))}`;
    }
    case "Discount": {
      const [price, rate] = numberList(value, 2);
      return `You save: ${prettify((price * rate) / 100)}\nSale price: ${prettify(price * (1 - rate / 100))}`;
    }
    case "Age": {
      const born = new Date(value);
      if (Number.isNaN(born.getTime()) || born > new Date())
        throw new Error("Enter a valid birth date in YYYY-MM-DD format.");
      const today = new Date();
      let years = today.getFullYear() - born.getFullYear();
      let months = today.getMonth() - born.getMonth();
      let days = today.getDate() - born.getDate();
      if (days < 0) {
        months--;
        days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
      }
      if (months < 0) {
        years--;
        months += 12;
      }
      return `${years} years, ${months} months, ${days} days`;
    }
    case "BMI": {
      const [kg, cm] = numberList(value, 2);
      if (kg <= 0 || cm <= 0)
        throw new Error("Enter weight in kilograms and height in centimeters.");
      const bmi = kg / (cm / 100) ** 2;
      const category =
        bmi < 18.5
          ? "Below typical adult range"
          : bmi < 25
            ? "Typical adult range"
            : bmi < 30
              ? "Above typical adult range"
              : "High adult range";
      return `BMI: ${prettify(bmi)}\nCategory: ${category}\nThis screening estimate is not a medical diagnosis.`;
    }
    case "Currency": {
      const [amountText, fromText, toText] = args;
      const amount = Number(amountText);
      const from = (fromText || "").toUpperCase();
      const to = (toText || "").toUpperCase();
      if (!(amount >= 0) || !/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to))
        throw new Error(
          "Enter amount, source code, target code (example: 25, USD, EUR).",
        );
      if (from === to)
        return `${amount} ${from} = ${amount} ${to}\nRate: 1\nSame-currency conversion; no API request was needed.`;
      const response = await fetch(
        `https://api.frankfurter.dev/v2/rate/${encodeURIComponent(from)}/${encodeURIComponent(to)}`,
        { signal },
      );
      if (!response.ok)
        throw new Error(
          response.status === 422
            ? "That currency pair is unavailable from the rates provider."
            : "Exchange-rate service is unavailable. Try again later.",
        );
      const data = await response.json();
      return `${amount} ${from} = ${prettify(amount * data.rate)} ${to}\nRate: 1 ${from} = ${data.rate} ${to}\nRate date: ${data.date}\nSource: Frankfurter reference rates.`;
    }
    case "CGPA ↔ Percentage Converter": {
      const score = Number(value);
      if (!Number.isFinite(score) || score < 0)
        throw new Error("Enter a non-negative CGPA or percentage.");
      if (score <= 10)
        return `${score} CGPA ≈ ${prettify(score * 9.5)}%\nFormula used: CGPA × 9.5`;
      if (score <= 100)
        return `${score}% ≈ ${prettify(score / 9.5)} CGPA\nFormula used: percentage ÷ 9.5`;
      throw new Error("Enter a CGPA up to 10 or a percentage up to 100.");
    }
    case "Length":
    case "Weight":
    case "Area":
    case "Data Storage":
    case "Time": {
      const [amountText, from, to] = args;
      const amount = Number(amountText);
      const map = units[name];
      if (!Number.isFinite(amount) || !map[from] || !map[to])
        throw new Error(
          `Enter amount, from unit, to unit. Supported: ${Object.keys(map).join(", ")}.`,
        );
      return `${amount} ${from} = ${prettify((amount * map[from]) / map[to])} ${to}`;
    }
    case "Temperature": {
      const [amountText, fromRaw, toRaw] = args;
      const amount = Number(amountText);
      const from = (fromRaw || "").toUpperCase();
      const to = (toRaw || "").toUpperCase();
      if (
        !Number.isFinite(amount) ||
        !["C", "F", "K"].includes(from) ||
        !["C", "F", "K"].includes(to)
      )
        throw new Error(
          "Enter amount, source, target (example: 25, C, F). Units: C, F, K.",
        );
      const c =
        from === "C"
          ? amount
          : from === "F"
            ? ((amount - 32) * 5) / 9
            : amount - 273.15;
      const result =
        to === "C" ? c : to === "F" ? (c * 9) / 5 + 32 : c + 273.15;
      return `${amount} °${from} = ${prettify(result)} °${to}`;
    }
    case "JSON Formatter":
      return JSON.stringify(JSON.parse(value), null, 2);
    case "JSON Validator":
      JSON.parse(value);
      return "Valid JSON. The document parsed successfully.";
    case "JWT Decoder": {
      const pieces = value.split(".");
      if (pieces.length !== 3)
        throw new Error("Enter a JWT with three dot-separated parts.");
      const decode = (part) =>
        JSON.stringify(
          JSON.parse(
            decodeURIComponent(
              Array.from(
                atob(part.replace(/-/g, "+").replace(/_/g, "/")),
                (char) =>
                  `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`,
              ).join(""),
            ),
          ),
          null,
          2,
        );
      return `HEADER\n${decode(pieces[0])}\n\nPAYLOAD\n${decode(pieces[1])}\n\nDecoding does not verify the signature.`;
    }
    case "UUID Generator":
      return crypto.randomUUID();
    case "Base64":
      return value.startsWith("decode:")
        ? decodeURIComponent(escape(atob(value.slice(7))))
        : btoa(unescape(encodeURIComponent(value)));
    case "URL Encoder":
      return value.startsWith("decode:")
        ? decodeURIComponent(value.slice(7))
        : encodeURIComponent(value);
    case "Regex Tester": {
      const [patternLine, ...text] = value.split("\n");
      if (!patternLine || text.length === 0)
        throw new Error(
          "Enter the regex pattern and flags on line 1, then test text on line 2. Example: \\bcat\\b gi",
        );
      const parts = patternLine.trim().split(/\s+/);
      const source = parts.shift();
      const regexFlags = (parts[0] || "").replace(/[^dgimsuvy]/g, "");
      const matcher = new RegExp(source, regexFlags || undefined);
      const sample = text.join("\n");
      const matches = [
        ...sample.matchAll(
          new RegExp(
            matcher.source,
            matcher.flags.includes("g") ? matcher.flags : `${matcher.flags}g`,
          ),
        ),
      ];
      return matches.length
        ? `${matches.length} match(es):\n${matches.map((match) => `• ${match[0]} (index ${match.index})`).join("\n")}`
        : "No matches found.";
    }
    case "SQL Formatter":
      return value
        .replace(/\s+/g, " ")
        .replace(
          /\b(SELECT|FROM|WHERE|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|ON|GROUP BY|ORDER BY|HAVING|LIMIT|VALUES|SET|INSERT INTO|UPDATE|DELETE FROM)\b/gi,
          "\n$1",
        )
        .trim();
    case "Timestamp Converter": {
      const raw = Number(value);
      if (!Number.isFinite(raw))
        throw new Error("Enter a Unix timestamp in seconds or milliseconds.");
      const date = new Date(Math.abs(raw) < 1e12 ? raw * 1000 : raw);
      if (Number.isNaN(date.getTime()))
        throw new Error("Timestamp is outside the supported date range.");
      return `UTC: ${date.toISOString()}\nLocal: ${date.toLocaleString()}\nUnix seconds: ${Math.floor(date.getTime() / 1000)}\nUnix milliseconds: ${date.getTime()}`;
    }
    case "API Request Builder": {
      let config;
      try {
        config = JSON.parse(value);
      } catch {
        throw new Error(
          'Enter JSON with "url", "method", and optional "headers", "params", and "body" fields.',
        );
      }
      const url = new URL(config.url);
      if (!/^https?:$/.test(url.protocol))
        throw new Error("Request URL must use HTTP or HTTPS.");
      Object.entries(config.params || {}).forEach(([key, item]) =>
        url.searchParams.set(key, item),
      );
      const method = String(config.method || "GET").toUpperCase();
      if (!/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/.test(method))
        throw new Error("Choose a supported HTTP method.");
      const headers = config.headers || {};
      if (!headers || Array.isArray(headers) || typeof headers !== "object")
        throw new Error("Headers must be a JSON object.");
      const response = await fetch(url, {
        method,
        headers,
        body:
          ["GET", "HEAD"].includes(method) || config.body === undefined
            ? undefined
            : typeof config.body === "string"
              ? config.body
              : JSON.stringify(config.body),
        signal,
      });
      const responseText = await response.text();
      let body = responseText;
      try {
        body = JSON.stringify(JSON.parse(responseText), null, 2);
      } catch {
        /* Keep non-JSON response text readable. */
      }
      return `HTTP ${response.status} ${response.statusText}\n${response.headers.get("content-type") || ""}\n\n${body.slice(0, 20000)}`;
    }
    case "HTTP Request Generator": {
      const config = JSON.parse(value);
      const url = new URL(config.url);
      const method = String(config.method || "GET").toUpperCase();
      if (!/^https?:$/.test(url.protocol))
        throw new Error("Enter a valid HTTP or HTTPS URL.");
      const headers = JSON.stringify(config.headers || {}, null, 2);
      const body =
        config.body === undefined ? "" : JSON.stringify(config.body, null, 2);
      const curlBody =
        config.body === undefined
          ? ""
          : ` \\\n  --data '${JSON.stringify(config.body).replace(/'/g, "'\\''")}'`;
      const javaBody = body
        ? `\n        .POST(HttpRequest.BodyPublishers.ofString(${JSON.stringify(body)}))`
        : "\n        .GET()";
      return `// fetch()\nconst response = await fetch(${JSON.stringify(url.href)}, {\n  method: ${JSON.stringify(method)},\n  headers: ${headers},${body ? `\n  body: JSON.stringify(${body}),` : ""}\n});\n\n// Axios\nconst result = await axios({ url: ${JSON.stringify(url.href)}, method: ${JSON.stringify(method.toLowerCase())}, headers: ${headers}${body ? `, data: ${body}` : ""} });\n\n// cURL\ncurl -X ${method} '${url.href}' -H 'Content-Type: application/json'${curlBody}\n\n// Java HttpClient\nHttpRequest request = HttpRequest.newBuilder(URI.create(${JSON.stringify(url.href)}))${javaBody}\n        .build();`;
    }
    case "JSON → TypeScript Interface Generator": {
      const object = JSON.parse(value);
      if (!object || Array.isArray(object) || typeof object !== "object")
        throw new Error("Provide a JSON object at the top level.");
      const typeOf = (item) =>
        item === null
          ? "null"
          : Array.isArray(item)
            ? `${item.length ? typeOf(item[0]) : "unknown"}[]`
            : typeof item === "object"
              ? "object"
              : typeof item === "number"
                ? "number"
                : typeof item;
      const fields = Object.entries(object)
        .map(
          ([key, item]) =>
            `  ${/^[$A-Z_a-z][$\w]*$/.test(key) ? key : JSON.stringify(key)}${item === null ? "?" : ""}: ${typeOf(item)};`,
        )
        .join("\n");
      return `export interface RootObject {\n${fields}\n}`;
    }
    case "JSON → Java Class Generator": {
      const object = JSON.parse(value);
      if (!object || Array.isArray(object) || typeof object !== "object")
        throw new Error("Provide a JSON object at the top level.");
      const javaType = (item) =>
        item === null
          ? "Object"
          : Array.isArray(item)
            ? `List<${javaType(item[0])}>`
            : typeof item === "object"
              ? "Object"
              : typeof item === "number"
                ? Number.isInteger(item)
                  ? "Integer"
                  : "Double"
                : typeof item === "boolean"
                  ? "Boolean"
                  : "String";
      return `import java.util.List;\n\npublic class Root {\n${Object.entries(
        object,
      )
        .map(([key, item]) => `    private ${javaType(item)} ${key};`)
        .join("\n")}\n}`;
    }
    case "JSON → SQL Table Generator": {
      const object = JSON.parse(value);
      if (!object || Array.isArray(object) || typeof object !== "object")
        throw new Error("Provide a JSON object at the top level.");
      const sqlType = (item) =>
        item === null
          ? "TEXT"
          : typeof item === "number"
            ? Number.isInteger(item)
              ? "BIGINT"
              : "DECIMAL(18, 4)"
            : typeof item === "boolean"
              ? "BOOLEAN"
              : Array.isArray(item) || typeof item === "object"
                ? "JSON"
                : "VARCHAR(255)";
      return `CREATE TABLE generated_table (\n${Object.entries(object)
        .map(
          ([key, item]) =>
            `  ${key.replace(/[^a-zA-Z0-9_]/g, "_")} ${sqlType(item)}`,
        )
        .join(",\n")}\n);`;
    }
    case "SQL → Java Entity Generator": {
      const columns = value
        .split(/[,\n]+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [name, type = "VARCHAR"] = line.split(/\s+/);
          return {
            name: name.replace(/[^a-zA-Z0-9_]/g, ""),
            type: /int|serial/i.test(type)
              ? "Long"
              : /decimal|numeric|float|double/i.test(type)
                ? "BigDecimal"
                : /bool/i.test(type)
                  ? "Boolean"
                  : /date|time/i.test(type)
                    ? "LocalDateTime"
                    : "String",
          };
        });
      if (!columns.length)
        throw new Error("Enter columns like: id BIGINT, name VARCHAR(100)");
      const imports = [...new Set(columns.map((column) => column.type))]
        .filter((type) => ["BigDecimal", "LocalDateTime"].includes(type))
        .map(
          (type) =>
            `import java.${type === "BigDecimal" ? "math.BigDecimal" : "time.LocalDateTime"};`,
        )
        .join("\n");
      return `${imports ? imports + "\n\n" : ""}public class GeneratedEntity {\n${columns.map(({ name, type }) => `    private ${type} ${name};`).join("\n")}\n}`;
    }
    case "Java Getter/Setter Generator":
    case "Java DTO Generator": {
      const fields = value
        .split(/[;,\n]+/)
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
          const match = part.match(
            /(?:(?:private|public|protected)\s+)?([\w<>\[\]]+)\s+(\w+)/,
          );
          return match && { type: match[1], name: match[2] };
        })
        .filter(Boolean);
      if (!fields.length)
        throw new Error(
          "Enter Java fields like: private String firstName; private int age;",
        );
      const cap = (name) => name[0].toUpperCase() + name.slice(1);
      const accessors = fields
        .map(
          ({ type, name }) =>
            `    public ${type} get${cap(name)}() { return ${name}; }\n    public void set${cap(name)}(${type} ${name}) { this.${name} = ${name}; }`,
        )
        .join("\n");
      if (name === "Java Getter/Setter Generator") return accessors;
      return `public class GeneratedDto {\n${fields.map(({ type, name }) => `    private ${type} ${name};`).join("\n")}\n\n    public GeneratedDto() {}\n\n    public GeneratedDto(${fields.map(({ type, name }) => `${type} ${name}`).join(", ")}) {\n${fields.map(({ name }) => `        this.${name} = ${name};`).join("\n")}\n    }\n\n${accessors}\n}`;
    }
    case "Spring Boot CRUD Generator": {
      const [entity = "Item", ...fieldParts] = value
        .split(/[;,\n]+/)
        .map((part) => part.trim())
        .filter(Boolean);
      const className = entity.replace(/[^A-Za-z0-9]/g, "") || "Item";
      const fields = fieldParts
        .map((part) => {
          const match = part.match(/([\w<>]+)\s+(\w+)/);
          return match && { type: match[1], name: match[2] };
        })
        .filter(Boolean);
      if (!fields.length)
        throw new Error(
          "Enter entity name and fields, for example: Product, Long id, String name",
        );
      const fieldCode = fields
        .map(({ type, name }) => `    private ${type} ${name};`)
        .join("\n");
      return `// ${className}.java\n@Entity\npublic class ${className} {\n    @Id @GeneratedValue\n    private Long id;\n${fieldCode}\n}\n\n// ${className}Repository.java\npublic interface ${className}Repository extends JpaRepository<${className}, Long> {}\n\n// ${className}Service.java\n@Service\npublic class ${className}Service {\n    private final ${className}Repository repository;\n    public ${className}Service(${className}Repository repository) { this.repository = repository; }\n    public List<${className}> findAll() { return repository.findAll(); }\n    public Optional<${className}> findById(Long id) { return repository.findById(id); }\n    public ${className} save(${className} item) { return repository.save(item); }\n    public void delete(Long id) { repository.deleteById(id); }\n}\n\n// ${className}Controller.java\n@RestController\n@RequestMapping("/api/${className.toLowerCase()}s")\npublic class ${className}Controller {\n    private final ${className}Service service;\n    public ${className}Controller(${className}Service service) { this.service = service; }\n    @GetMapping public List<${className}> all() { return service.findAll(); }\n    @GetMapping("/{id}") public Optional<${className}> one(@PathVariable Long id) { return service.findById(id); }\n    @PostMapping public ${className} create(@RequestBody ${className} item) { return service.save(item); }\n    @PutMapping public ${className} update(@RequestBody ${className} item) { return service.save(item); }\n    @DeleteMapping("/{id}") public void delete(@PathVariable Long id) { service.delete(id); }\n}`;
    }
    case "Regex Explainer": {
      if (!value) throw new Error("Enter a regular expression.");
      const notes = {
        "\\d": "a digit",
        "\\D": "a non-digit",
        "\\w": "a letter, digit, or underscore",
        "\\W": "a non-word character",
        "\\s": "whitespace",
        ".": "any character except a line break",
        "^": "the start of the input",
        $: "the end of the input",
        "*": "zero or more of the previous token",
        "+": "one or more of the previous token",
        "?": "zero or one of the previous token",
        "{": "a repetition-count range",
        "[": "a character set",
        "(": "a capture group",
        "|": "an either/or alternative",
      };
      return `Pattern: ${value}\n\n${[...value].map((token) => `${JSON.stringify(token)} — ${notes[token] || "a literal character or pattern delimiter"}`).join("\n")}\n\nExplanation is based on common JavaScript regular-expression syntax.`;
    }
    case "Regex Generator": {
      const patterns = {
        email: "^[\\w.+-]+@[\\w.-]+\\.[A-Za-z]{2,}$",
        url: "https?://[^\\s]+",
        phone: "^\\+?[0-9 ()-]{7,20}$",
        date: "^\\d{4}-\\d{2}-\\d{2}$",
        digits: "^\\d+$",
        "postal code": "^[A-Za-z0-9 -]{3,10}$",
      };
      const requirement = value.toLowerCase();
      if (!patterns[requirement])
        throw new Error(`Choose one: ${Object.keys(patterns).join(", ")}.`);
      return patterns[requirement];
    }
    case "Cron Expression Explainer": {
      const fields = value.split(/\s+/);
      if (fields.length !== 5)
        throw new Error(
          "Enter a five-field cron expression: minute hour day month weekday.",
        );
      const names = ["minute", "hour", "day of month", "month", "day of week"];
      return (
        fields
          .map(
            (field, index) =>
              `${names[index]}: ${field === "*" ? "every value" : field.includes("/") ? `every ${field.split("/")[1]} starting at ${field.split("/")[0]}` : field.includes(",") ? `at ${field.replace(/,/g, ", ")}` : field.includes("-") ? `from ${field.replace("-", " through ")}` : `at ${field}`}`,
          )
          .join("\n") +
        "\n\nCron schedules use the system timezone where the job runs."
      );
    }
    case "HTTP Status Code Explorer": {
      const code = Number(value);
      const entries = {
        200: "OK — request succeeded.",
        201: "Created — a resource was created.",
        204: "No Content — success with no response body.",
        301: "Moved Permanently — resource has a new permanent URL.",
        400: "Bad Request — check request syntax and required fields.",
        401: "Unauthorized — provide valid authentication.",
        403: "Forbidden — the server understood but refuses access.",
        404: "Not Found — check the URL and resource identifier.",
        409: "Conflict — request conflicts with current resource state.",
        422: "Unprocessable Content — check field values and business rules.",
        429: "Too Many Requests — slow down and respect Retry-After.",
        500: "Internal Server Error — server failed unexpectedly.",
        502: "Bad Gateway — an upstream server returned an invalid response.",
        503: "Service Unavailable — retry later; the service may be overloaded.",
      };
      if (!Number.isInteger(code) || code < 100 || code > 599)
        throw new Error("Enter an HTTP status code from 100 to 599.");
      return (
        entries[code] ||
        `HTTP ${code} — ${code < 200 ? "Informational response" : code < 300 ? "Successful response" : code < 400 ? "Redirection" : code < 500 ? "Client error" : "Server error"}. Check the API's documentation for code-specific details.`
      );
    }
    case "Git Command Generator": {
      const commands = {
        status: "git status",
        "new branch": "git switch -c <branch-name>",
        checkout: "git switch <branch-name>",
        commit: 'git add . && git commit -m "<message>"',
        push: "git push -u origin <branch-name>",
        pull: "git pull --rebase",
        "undo last commit": "git reset --soft HEAD~1",
        "new repository": "git init",
        clone: "git clone <repository-url>",
        stash: 'git stash push -m "<message>"',
      };
      const operation = value.toLowerCase();
      if (!commands[operation])
        throw new Error(`Choose one: ${Object.keys(commands).join(", ")}.`);
      return commands[operation];
    }
    case ".gitignore Generator": {
      const templates = {
        react: "node_modules/\ndist/\n.env\n.env.*\n!.env.example\n.DS_Store",
        node: "node_modules/\n.npm/\ndist/\n.env\n.env.*\n!.env.example",
        java: "target/\n*.class\n*.jar\n.idea/\n*.iml\n.env",
        python: "__pycache__/\n*.py[cod]\n.venv/\nvenv/\n.env\n.pytest_cache/",
        "react,node":
          "node_modules/\ndist/\nbuild/\n.env\n.env.*\n!.env.example\n.DS_Store",
      };
      const stack = value.toLowerCase();
      if (!templates[stack])
        throw new Error("Choose React, Node, Java, Python, or React,Node.");
      return templates[stack];
    }
    case "Word Counter":
      return `Words: ${(value.match(/\S+/g) || []).length}\nCharacters: ${value.length}\nCharacters (no spaces): ${value.replace(/\s/g, "").length}\nSentences: ${(value.match(/[.!?]+/g) || []).length}\nReading time: ${Math.ceil((value.match(/\S+/g) || []).length / 200)} min`;
    case "Text Summarizer": {
      const sentences = value.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
      if (!sentences.length) throw new Error("Paste some text to summarize.");
      const stopWords = new Set(
        "the and for with that this from have your into about are was were has had but not you our they their then than when what which will can all use using also more most such each".split(
          " ",
        ),
      );
      const frequency = new Map();
      (value.toLowerCase().match(/[a-z]{3,}/g) || [])
        .filter((word) => !stopWords.has(word))
        .forEach((word) => frequency.set(word, (frequency.get(word) || 0) + 1));
      const ranked = sentences.map((sentence, index) => ({
        sentence: sentence.trim(),
        index,
        score:
          (sentence.toLowerCase().match(/[a-z]{3,}/g) || []).reduce(
            (sum, word) => sum + (frequency.get(word) || 0),
            0,
          ) / Math.max(1, sentence.split(/\s+/).length),
      }));
      return ranked
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.max(1, Math.ceil(sentences.length / 3)))
        .sort((a, b) => a.index - b.index)
        .map((item) => item.sentence)
        .join(" ");
    }
    case "Case Converter":
      return `UPPERCASE\n${value.toUpperCase()}\n\nlowercase\n${value.toLowerCase()}\n\nTitle Case\n${titleCase(value)}`;
    case "Text Cleaner":
      return value
        .replace(/[\t ]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    case "Lorem Ipsum": {
      const amount = Math.max(1, Math.min(20, Number(value) || 3));
      const sentence =
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
      return Array.from(
        { length: amount },
        (_, index) =>
          sentence +
          (index % 2
            ? " Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
            : ""),
      ).join(" ");
    }
    case "Password Generator":
      return Array.from(
        crypto.getRandomValues(new Uint32Array(20)),
        (number) =>
          "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*"[
            number % 67
          ],
      ).join("");
    case "Color Picker":
    case "HEX/RGB/HSL Converter": {
      const match = value.match(/^#?([\da-f]{3}|[\da-f]{6})$/i);
      if (!match)
        throw new Error("Enter a 3- or 6-digit HEX color (example: #81283f).");
      let hex = match[1];
      if (hex.length === 3)
        hex = [...hex].map((digit) => digit + digit).join("");
      const [r, g, b] = hex.match(/.{2}/g).map((part) => parseInt(part, 16));
      const rr = r / 255;
      const gg = g / 255;
      const bb = b / 255;
      const max = Math.max(rr, gg, bb);
      const min = Math.min(rr, gg, bb);
      const delta = max - min;
      let h = 0;
      const l = (max + min) / 2;
      let s = 0;
      if (delta) {
        s = delta / (1 - Math.abs(2 * l - 1));
        if (max === rr) h = ((gg - bb) / delta) % 6;
        else if (max === gg) h = (bb - rr) / delta + 2;
        else h = (rr - gg) / delta + 4;
        h *= 60;
        if (h < 0) h += 360;
      }
      return `Preview: #${hex.toUpperCase()}\nHEX: #${hex.toUpperCase()}\nRGB: rgb(${r}, ${g}, ${b})\nHSL: hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
    }
    case "Gradient Generator": {
      const [first, second] = args;
      if (
        !/^#?[\da-f]{3}([\da-f]{3})?$/i.test(first || "") ||
        !/^#?[\da-f]{3}([\da-f]{3})?$/i.test(second || "")
      )
        throw new Error("Enter two HEX colors (example: #81283f, #f5e9ed).");
      return `background: linear-gradient(135deg, #${first.replace(/^#/, "")}, #${second.replace(/^#/, "")});`;
    }
    case "Job Description Keyword Extractor": {
      const technical = [
        "Java",
        "JavaScript",
        "TypeScript",
        "Python",
        "React",
        "Angular",
        "Vue",
        "Node.js",
        "Spring Boot",
        "SQL",
        "MySQL",
        "PostgreSQL",
        "AWS",
        "Azure",
        "Docker",
        "Kubernetes",
        "Git",
        "REST API",
        "HTML",
        "CSS",
        "Machine Learning",
        "Excel",
        "Figma",
      ];
      const soft = [
        "communication",
        "leadership",
        "collaboration",
        "teamwork",
        "problem-solving",
        "adaptability",
        "time management",
        "ownership",
        "mentoring",
      ];
      const find = (words) =>
        words.filter((word) =>
          new RegExp(
            `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
            "i",
          ).test(value),
        );
      const important = [
        ...new Set(
          (
            value.match(
              /\b[A-Z][A-Za-z+#.]{2,}(?:\s+[A-Z][A-Za-z+#.]{2,})?/g,
            ) || []
          ).concat(find(technical), find(soft)),
        ),
      ].slice(0, 35);
      return `Required / technical skills\n${find(technical).join(", ") || "No matches from the built-in skills list."}\n\nSoft skills\n${find(soft).join(", ") || "No common soft-skill terms found."}\n\nExperience\n${(value.match(/\b\d+\+?\s*(?:years?|yrs?)(?:\s+of\s+experience)?\b/gi) || []).join(", ") || "No explicit years-of-experience requirement found."}\n\nEducation\n${(value.match(/\b(?:bachelor'?s?|master'?s?|ph\.?d\.?|degree|diploma|b\.?tech|m\.?tech|mba)\b[^.\n]*/gi) || []).join("\n") || "No explicit education requirement found."}\n\nImportant keywords\n${important.join(", ") || "No keywords extracted."}`;
    }
    case "Resume Keyword Matcher":
    case "ATS Keyword Density Checker": {
      const sections = value.split(
        /\n-{3,}\s*(?:JOB DESCRIPTION|JOB)\s*-{3,}\n/i,
      );
      if (sections.length < 2)
        throw new Error(
          "Paste resume text, then a line with ---JOB DESCRIPTION---, then the job description.",
        );
      const resume = sections[0];
      const job = sections.slice(1).join("\n");
      const terms = [
        ...new Set(
          (
            job.match(
              /\b[A-Za-z][A-Za-z+#.-]{2,}(?:\s+[A-Za-z][A-Za-z+#.-]{2,})?/g,
            ) || []
          )
            .map((term) => term.trim())
            .filter(
              (term) =>
                !/^(the|and|for|with|from|this|that|you|our|will|are|have|has|who|what|when|where|years|year|work|team|role|job|ability|must|using)$/i.test(
                  term,
                ),
            ),
        ),
      ].slice(0, 45);
      const matched = terms.filter((term) =>
        resume.toLowerCase().includes(term.toLowerCase()),
      );
      const missing = terms.filter(
        (term) => !resume.toLowerCase().includes(term.toLowerCase()),
      );
      if (name === "Resume Keyword Matcher")
        return `Matched keywords (${matched.length})\n${matched.map((term) => `✓ ${term}`).join("\n") || "None found."}\n\nMissing keywords (${missing.length})\n${missing.map((term) => `○ ${term}`).join("\n") || "None."}`;
      const headings = [
        "experience",
        "education",
        "skills",
        "projects",
        "summary",
        "certifications",
      ];
      const present = headings.filter((heading) =>
        new RegExp(`^\\s*${heading}\\s*$`, "im").test(resume),
      );
      const repeated = terms.filter(
        (term) =>
          (
            resume.match(
              new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
            ) || []
          ).length > 5,
      );
      return `Keyword matches: ${matched.length} of ${terms.length}\nMissing job-description keywords: ${missing.join(", ") || "None detected"}\nCommon sections present: ${present.join(", ") || "No standard headings detected"}\nCommon sections missing: ${headings.filter((heading) => !present.includes(heading)).join(", ") || "None"}\nRepeated terms (more than 5 uses): ${repeated.join(", ") || "None detected"}\nFormatting checks: ${/[•●▪]/.test(resume) ? "Bullet characters detected" : "No bullet characters detected"}; ${resume.length > 0 && !/\n/.test(resume) ? "single-line text may be hard to parse" : "multiple lines detected"}.\n\nThis is a text-based checklist, not an ATS score or hiring prediction.`;
    }
    case "Resume Bullet Generator": {
      const [
        project = "the project",
        technology = "the technology",
        feature = "the feature",
        responsibility = "development",
        outcome = "a better user experience",
      ] = args;
      return [
        `Built ${feature} for ${project} using ${technology}, taking responsibility for ${responsibility} and supporting ${outcome}.`,
        `Implemented ${feature} in ${project} with ${technology}; owned ${responsibility} to deliver ${outcome}.`,
        `Contributed to ${project} by developing ${feature} with ${technology}, focusing on ${responsibility} and ${outcome}.`,
      ].join("\n\n");
    }
    case "Marks Percentage Calculator": {
      const marks = value
        .split(/[\n,;]+/)
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => part.split(/[/:]/).map(Number));
      if (
        !marks.length ||
        marks.some(
          (pair) =>
            pair.length !== 2 ||
            !pair.every(Number.isFinite) ||
            pair[1] <= 0 ||
            pair[0] < 0 ||
            pair[0] > pair[1],
        )
      )
        throw new Error(
          "Enter obtained/total for each subject, for example: 80/100, 75/100, 42/50.",
        );
      const obtained = marks.reduce((total, pair) => total + pair[0], 0);
      const possible = marks.reduce((total, pair) => total + pair[1], 0);
      return `Subjects: ${marks.length}\nTotal marks: ${possible}\nObtained marks: ${obtained}\nPercentage: ${prettify((obtained / possible) * 100)}%\nAverage percentage per subject: ${prettify(marks.reduce((sum, pair) => sum + (pair[0] / pair[1]) * 100, 0) / marks.length)}%`;
    }
    case "Study Time Planner": {
      const [hoursLine, ...subjects] = value
        .split(/[\n,]+/)
        .map((part) => part.trim())
        .filter(Boolean);
      const hours = Number(hoursLine);
      if (!(hours > 0) || !subjects.length)
        throw new Error(
          "Enter available hours first, then subjects separated by commas (example: 3\nMath, Physics, History).",
        );
      const perSubject = hours / subjects.length;
      return (
        subjects
          .map(
            (subject, index) =>
              `${index + 1}. ${subject} — ${prettify(perSubject)} hour(s)`,
          )
          .join("\n") + `\n\nTotal planned: ${hours} hour(s).`
      );
    }
    case "Exam Countdown": {
      const exam = new Date(value);
      if (Number.isNaN(exam.getTime()))
        throw new Error(
          "Enter an exam date and time, such as 2026-12-15T09:00.",
        );
      const remaining = exam.getTime() - Date.now();
      if (remaining <= 0) return "That exam time has passed.";
      const days = Math.floor(remaining / 86400000);
      const hours = Math.floor((remaining % 86400000) / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      return `${days} days, ${hours} hours, ${minutes} minutes remaining\nExam time: ${exam.toLocaleString()}`;
    }
    case "Attendance Calculator": {
      const [total, attended, target] = numberList(value, 3);
      if (
        total <= 0 ||
        attended < 0 ||
        attended > total ||
        target <= 0 ||
        target > 100
      )
        throw new Error(
          "Enter total classes, attended classes, and target percent.",
        );
      const current = (attended / total) * 100;
      const canMiss = Math.max(
        0,
        Math.floor((attended - (target * total) / 100) / (target / 100)),
      );
      const need =
        current >= target
          ? 0
          : Math.ceil(((target * total) / 100 - attended) / (1 - target / 100));
      return `Current attendance: ${prettify(current)}%\nClasses you can miss and stay at target: ${canMiss}\nClasses to attend consecutively to reach ${target}%: ${need}`;
    }
    case "Electricity Bill Estimator": {
      const [unitsText, ...slabs] = value
        .split(/[;,\n]+/)
        .map((part) => part.trim())
        .filter(Boolean);
      const units = Number(unitsText);
      if (!(units >= 0) || !slabs.length)
        throw new Error(
          "Enter units, then rate slabs like: 250, 100@3, 200@5, *@8.",
        );
      let previousLimit = 0;
      let total = 0;
      const lines = [];
      for (const slab of slabs) {
        const match = slab.match(/^(\*|\d+)\s*@\s*(\d+(?:\.\d+)?)$/);
        if (!match)
          throw new Error(
            "Each slab must look like 100@3, 200@5, or *@8 for the final open slab.",
          );
        const limit = match[1] === "*" ? Infinity : Number(match[1]);
        const rate = Number(match[2]);
        if (limit <= previousLimit || rate < 0)
          throw new Error(
            "Slab limits must increase; finish with *@rate to cover remaining units.",
          );
        const billed = Math.max(0, Math.min(units, limit) - previousLimit);
        const charge = billed * rate;
        total += charge;
        lines.push(`${billed} units × ${rate} = ${prettify(charge)}`);
        previousLimit = limit;
        if (limit === Infinity || units <= limit) break;
      }
      if (units > previousLimit)
        throw new Error("Add a final *@rate slab to cover all units.");
      return `Units consumed: ${units}\n${lines.join("\n")}\nEstimated energy charge: ${prettify(total)}\nFixed fees and taxes are not included.`;
    }
    case "Water Intake Calculator": {
      const [kg] = numberList(value, 1);
      if (kg <= 0) throw new Error("Enter your weight in kilograms.");
      return `Baseline estimate: ${prettify(kg * 0.035)} liters per day (35 ml/kg).\nNeeds vary with health, activity, climate, and diet. Follow your clinician's advice when relevant.`;
    }
    case "Sleep Calculator": {
      const match = value.match(/^(\d{1,2}):(\d{2})$/);
      if (!match || Number(match[1]) > 23 || Number(match[2]) > 59)
        throw new Error("Enter wake-up time as HH:MM (24-hour clock).");
      const wake = new Date();
      wake.setHours(Number(match[1]), Number(match[2]), 0, 0);
      return (
        [9, 7.5, 6]
          .map((duration) => {
            const bedtime = new Date(
              wake.getTime() - duration * 3600000 - 15 * 60000,
            );
            return `${duration} hours sleep + ~15 min to fall asleep: ${bedtime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
          })
          .join("\n") +
        "\n\nSleep cycles vary; these are approximate suggestions."
      );
    }
    case "Trip Cost Calculator": {
      const [distance, mileage, fuelPrice, people] = numberList(value, 4);
      if (distance <= 0 || mileage <= 0 || fuelPrice < 0 || people <= 0)
        throw new Error(
          "Enter one-way distance (km), mileage (km/L), fuel price per liter, and number of people.",
        );
      const liters = (distance * 2) / mileage;
      const cost = liters * fuelPrice;
      return `Round-trip distance: ${prettify(distance * 2)} km\nFuel required: ${prettify(liters)} L\nRound-trip fuel cost: ${prettify(cost)}\nCost per person: ${prettify(cost / people)}`;
    }
    default:
      throw new Error("This tool does not have an operation configured yet.");
  }
}

export function exampleFor(name) {
  const examples = {
    Percentage: "250, 15",
    EMI: "250000, 8.5, 60",
    Loan: "250000, 8.5, 60",
    GST: "1200, 18",
    Discount: "2499, 20",
    Age: "1995-06-15",
    BMI: "68, 172",
    Currency: "100, USD, EUR",
    Length: "5, km, miles",
    Weight: "70, kg, lb",
    Temperature: "25, C, F",
    Time: "90, min, seconds",
    Area: "1, acre, m2",
    "Data Storage": "2, GB, MB",
    "CGPA ↔ Percentage Converter": "8.2",
    "API Request Builder":
      '{"url":"https://api.github.com/repos/facebook/react","method":"GET","headers":{"Accept":"application/vnd.github+json"}}',
    "HTTP Request Generator":
      '{"url":"https://api.example.com/items","method":"POST","headers":{"Content-Type":"application/json"},"body":{"name":"sample"}}',
    "JSON → Java Class Generator": '{"id":42,"name":"Mira","active":true}',
    "JSON → TypeScript Interface Generator":
      '{"id":42,"name":"Mira","active":true}',
    "JSON → SQL Table Generator": '{"id":42,"name":"Mira","active":true}',
    "SQL → Java Entity Generator":
      "id BIGINT, name VARCHAR(100), active BOOLEAN",
    "Java Getter/Setter Generator":
      "private String firstName; private int age;",
    "Java DTO Generator": "private String firstName; private int age;",
    "Spring Boot CRUD Generator":
      "Product, Long id, String name, BigDecimal price",
    "Regex Explainer": "^\\d{4}-\\d{2}-\\d{2}$",
    "Regex Generator": "email",
    "Cron Expression Explainer": "0 9 * * 1-5",
    "HTTP Status Code Explorer": "404",
    "Git Command Generator": "new branch",
    ".gitignore Generator": "React",
    "JSON Formatter": '{"name":"MultiTool","tools":["fast","useful"]}',
    "JSON Validator": '{"valid":true}',
    "JWT Decoder": "Paste a three-part JWT token",
    "UUID Generator": "Click Run to generate an ID",
    Base64: "MultiTool text (or prefix with decode:)",
    "URL Encoder": "Multi tool & search (or prefix with decode:)",
    "Regex Tester": "\\bcat\\b gi\nThe cat sat beside a cat.",
    "SQL Formatter":
      "SELECT id, name FROM users WHERE active = 1 ORDER BY name;",
    "Timestamp Converter": "1700000000",
    "Word Counter":
      "A little text goes a long way. Count words and characters in seconds.",
    "Case Converter": "MultiTool makes everyday work lighter.",
    "Text Cleaner": "  clean   up   extra spaces\n\n\nAnd blank lines.\n",
    "Text Summarizer":
      "MultiTool is a collection of useful utilities. The tools run in your browser. Calculators help with everyday maths. Developer tools format and inspect data. Text tools make writing easier. The design is simple and quick to use.",
    "Lorem Ipsum": "3",
    "Password Generator": "Click Run to generate a secure random password",
    "Color Picker": "#81283f",
    "HEX/RGB/HSL Converter": "#426b54",
    "Gradient Generator": "#81283f, #f5e9ed",
    "Job Description Keyword Extractor":
      "We need a Java developer with Spring Boot, SQL, communication skills, and 3+ years of experience. Bachelor's degree preferred.",
    "Resume Keyword Matcher":
      "Java, Spring Boot, React\n---JOB DESCRIPTION---\nJava, Spring Boot, Docker, AWS",
    "Resume Bullet Generator":
      "VegKart, React + Spring Boot, shopping cart, checkout flow, reliable purchase experience",
    "ATS Keyword Density Checker":
      "Experience\nBuilt apps with Java and Spring Boot.\nSkills\nJava, Spring Boot\n---JOB DESCRIPTION---\nJava, Spring Boot, Docker, AWS",
    "Marks Percentage Calculator": "80/100, 75/100, 42/50",
    "Study Time Planner": "3\nMath, Physics, History",
    "Pomodoro Timer": "Use the timer controls above",
    "Exam Countdown": "Choose an exam date above",
    "Attendance Calculator": "100, 76, 80",
    "Electricity Bill Estimator": "250, 100@3, 200@5, *@8",
    "Water Intake Calculator": "68",
    "Sleep Calculator": "06:30",
    "Trip Cost Calculator": "120, 15, 105, 3",
  };
  return examples[name] || "";
}

export function inputHint(name) {
  const hints = {
    Percentage: "Amount, percentage (example: 250, 15)",
    EMI: "Principal, annual interest rate %, number of months (example: 250000, 8.5, 60)",
    Loan: "Principal, annual interest rate %, number of months (example: 250000, 8.5, 60)",
    GST: "Amount before GST, GST rate % (example: 1200, 18)",
    Discount: "Original price, discount % (example: 2499, 20)",
    Age: "Birth date in YYYY-MM-DD format",
    BMI: "Weight in kg, height in cm (example: 68, 172)",
    Currency:
      "Amount, source currency, target currency (example: 100, USD, EUR)",
    Length: "Amount, source unit, target unit (example: 5, km, miles)",
    Weight: "Amount, source unit, target unit (example: 70, kg, lb)",
    Temperature: "Amount, source unit, target unit (example: 25, C, F)",
    Time: "Amount, source unit, target unit (example: 90, min, seconds)",
    Area: "Amount, source unit, target unit (example: 1, acre, m2)",
    "Data Storage": "Amount, source unit, target unit (example: 2, GB, MB)",
    "CGPA ↔ Percentage Converter":
      "Enter CGPA up to 10 or percentage up to 100",
    "API Request Builder":
      "JSON config: url, method, optional headers, params, and body",
    "HTTP Request Generator":
      "JSON config with url, method, headers, and optional body",
    "JSON → Java Class Generator": "Paste a JSON object",
    "JSON → TypeScript Interface Generator": "Paste a JSON object",
    "JSON → SQL Table Generator": "Paste a JSON object",
    "SQL → Java Entity Generator":
      "Columns such as id BIGINT, name VARCHAR(100)",
    "Java Getter/Setter Generator":
      "Paste Java declarations, e.g. private String name;",
    "Java DTO Generator": "Paste Java declarations, e.g. private String name;",
    "Spring Boot CRUD Generator":
      "Entity name, then typed fields: Product, Long id, String name",
    "Regex Explainer": "Enter a JavaScript regular expression",
    "Regex Generator": "Choose email, url, phone, date, digits, or postal code",
    "Cron Expression Explainer": "Five fields: minute hour day month weekday",
    "HTTP Status Code Explorer": "Enter a status code, e.g. 404",
    "Git Command Generator":
      "Choose status, new branch, checkout, commit, push, pull, stash, or clone",
    ".gitignore Generator": "Choose React, Node, Java, Python, or React,Node",
    "JWT Decoder": "Paste a JWT token (three dot-separated parts)",
    Base64: "Text to encode, or use decode:BASE64 to decode",
    "URL Encoder": "Text to encode, or use decode:ENCODED_TEXT to decode",
    "Regex Tester": "Pattern and flags on line 1; test text on following lines",
    "Lorem Ipsum": "Number of placeholder sentences (1–20)",
    "Color Picker": "HEX color (example: #81283f)",
    "HEX/RGB/HSL Converter": "HEX color (example: #426b54)",
    "Gradient Generator": "Two HEX colors separated by a comma",
    "Job Description Keyword Extractor": "Paste the full job description",
    "Resume Keyword Matcher":
      "Resume text, then ---JOB DESCRIPTION---, then the job text",
    "Resume Bullet Generator":
      "Project, technology, feature, responsibility, outcome",
    "ATS Keyword Density Checker":
      "Resume text, then ---JOB DESCRIPTION---, then the job text",
    "Marks Percentage Calculator":
      "Obtained/total per subject, e.g. 80/100, 75/100",
    "Study Time Planner":
      "Hours available on line 1, subjects below separated by commas",
    "Attendance Calculator": "Total classes, attended, target percentage",
    "Electricity Bill Estimator":
      "Units and increasing slabs, e.g. 250, 100@3, 200@5, *@8",
    "Water Intake Calculator": "Weight in kilograms",
    "Sleep Calculator": "Wake-up time in 24-hour HH:MM format",
    "Trip Cost Calculator":
      "One-way km, km per liter, fuel price/L, number of people",
  };
  return hints[name] || `Enter ${name.toLowerCase()} input…`;
}
