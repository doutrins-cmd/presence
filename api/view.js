import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// ... o resto da função continua igual ...
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(request, response) {
  try {
    // 1. Pega o valor atual do contador
    const { data: currentData, error: selectError } = await supabase
      .from('views')
      .select('views') // ALTERADO de 'count' para 'views'
      .eq('id', 1)
      .single();

    if (selectError) {
      throw selectError;
    }

    const newCount = currentData.views + 1; // ALTERADO de currentData.count

    // 2. Atualiza o contador com o novo valor
    const { data: updatedData, error: updateError } = await supabase
      .from('views')
      .update({ views: newCount }) // ALTERADO de { count: newCount }
      .eq('id', 1)
      .select()
      .single();
    
    if (updateError) {
      throw updateError;
    }

    // 3. Retorna o novo valor com sucesso
    response.setHeader('Access-Control-Allow-Origin', '*');
    return response.status(200).json({
      count: updatedData.views, // ALTERADO de updatedData.count
    });

  } catch (error) {
    return response.status(500).json({
      message: 'Erro no servidor',
      error: error.message,
    });
  }
}