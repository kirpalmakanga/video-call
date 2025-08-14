import nunjucks from 'nunjucks';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const nunjucksEnv = nunjucks.configure(resolve(__dirname, '../views'), {
    autoescape: true
});

export function renderView(
    templatePath: string,
    context?: Record<string, unknown>
) {
    return nunjucksEnv.render(`${templatePath}.njk`, context);
}
