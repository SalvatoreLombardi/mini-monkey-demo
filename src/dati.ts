export type Prodotto = {
  id: string
  nome: string
  prezzo: number
  foto: string
  extra?: string[] // altre foto
  descrizione: string
  materiali: string
  taglie: string[] | null
  rimasti?: number // pezzi rimasti (solo se pochi)
  novita?: boolean
}

// Prodotti, prezzi e recensioni sono di esempio, solo per la dimostrazione
export const prodotti: Prodotto[] = [
  { id: 'vestitino-rosa', nome: 'Vestitino rosa con volant', prezzo: 68, foto: 'vestitino-rosa', extra: ['bimba-specchio', 'bimba-sdraiata'], descrizione: 'Un vestitino leggero con volant, lavorato punto dopo punto. Morbido sulla pelle, perfetto per le occasioni speciali e per i giorni d\'estate.', materiali: '100% cotone organico, lavorato a mano', taglie: ['3 mesi', '6 mesi', '12 mesi', '18 mesi'], rimasti: 2 },
  { id: 'completo-azzurro', nome: 'Completo azzurro polvere', prezzo: 64, foto: 'completo-azzurro', extra: ['bimba-pelliccia'], descrizione: 'Top e culotte all\'uncinetto in un azzurro polveroso. Si abbina a tutto e si lava in lavatrice a 30°.', materiali: '100% cotone organico', taglie: ['3 mesi', '6 mesi', '12 mesi'], novita: true },
  { id: 'completo-rosa', nome: 'Completo rosa antico', prezzo: 62, foto: 'completo-rosa', extra: ['bimba-cesta'], descrizione: 'Il rosa antico dei nostri completi: un colore delicato, che resta bello lavaggio dopo lavaggio.', materiali: '100% cotone organico', taglie: ['3 mesi', '6 mesi', '12 mesi'] },
  { id: 'cappellino-fragola', nome: 'Cappellino alle fragole', prezzo: 32, foto: 'cappellino-fragola', extra: ['bimba-cesta'], descrizione: 'Un cappellino con le fragole ricamate, ripara dal sole e fa sorridere chiunque lo veda.', materiali: 'Cotone organico, ricami a mano', taglie: ['0-6 mesi', '6-12 mesi', '1-2 anni'], rimasti: 3 },
  { id: 'clip-ciuccio', nome: 'Clip ciuccio personalizzata', prezzo: 18, foto: 'clip-ciuccio', extra: ['filato'], descrizione: 'Una clip per il ciuccio con il nome del tuo bambino. Il regalo perfetto per una nascita.', materiali: 'Cotone, perline in legno non trattato', taglie: null },
  { id: 'coperta', nome: 'Copertina in cotone', prezzo: 58, foto: 'coperta', extra: ['bimba-pelliccia', 'filato'], descrizione: 'Una copertina all\'uncinetto grande abbastanza per il passeggino e per la culla. Cresce con lui.', materiali: '100% cotone organico, 80 × 80 cm', taglie: null, novita: true },
]

export const recensioni = [
  { testo: 'Il vestitino è ancora più bello dal vivo, la lavorazione è perfetta. Lo abbiamo messo al battesimo.', nome: 'Giulia, Bari' },
  { testo: 'Ho regalato la copertina a mia sorella: ha pianto dalla commozione. Arrivata in una confezione bellissima.', nome: 'Marta, Altamura' },
  { testo: 'Morbidissimo, non dà fastidio alla pelle. Si vede che è fatto con cura e con tempo.', nome: 'Francesca, Matera' },
]

export const SOGLIA_SPEDIZIONE = 80
export const PREZZO_REGALO = 4

export const euro = (n: number) => n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
