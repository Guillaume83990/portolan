// Traduction des textes d'un yacht par Claude (bouton « Traduire avec l'IA » de l'éditeur).
// La proposition n'est jamais enregistrée sans relecture du directeur.
import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';

const LANGUES = { en: 'anglais britannique', de: 'allemand', it: 'italien' } as const;

const Reponse = z.object({ traductions: z.array(z.object({ champ: z.string(), texte: z.string() })) });

export async function traduireChamps(langue: keyof typeof LANGUES, champs: Record<string, string>) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('cle_ia_manquante');
  const client = new Anthropic();
  const entrees = Object.entries(champs).filter(([, t]) => t.trim());
  if (!entrees.length) return {};
  const reponse = await client.beta.messages.parse({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    // Si un filtre de sécurité refusait la demande, l'API la relance sur un autre modèle dans le même appel
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: betaZodOutputFormat(Reponse) },
    system:
      `Tu traduis les fiches d'un courtier en yachts de luxe (Saint-Tropez, Monaco) du français vers l'${LANGUES[langue]}. ` +
      'Ton : maison de prestige discrète, phrases sobres, aucune surenchère. Garde les noms propres (yachts, chantiers, lieux) tels quels, ' +
      'les unités et les chiffres. Traduis chaque champ séparément et renvoie exactement les mêmes identifiants de champ.',
    messages: [{ role: 'user', content: JSON.stringify(Object.fromEntries(entrees)) }],
  });
  if (reponse.stop_reason === 'refusal' || !reponse.parsed_output) throw new Error('traduction_impossible');
  return Object.fromEntries(reponse.parsed_output.traductions.filter((t) => t.champ in champs).map((t) => [t.champ, t.texte]));
}
