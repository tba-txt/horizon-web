import { Component, Input, Output, EventEmitter, HostListener, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Destination } from '../../models/destination.model';
import { DestinationWeather } from '../../models/weather.model';

export type MonthRating = 'BEST' | 'GOOD' | 'NORMAL';

export interface DestinationCuratedContent {
  headline: string;
  description: string;
  bestTime: string;
  bestTimeMonths?: MonthRating[]; // 12 meses: Jan a Dez
  topAttractions: string[];
  gallery: { url: string; title: string }[];
}

const DESTINATION_DETAILS_MAP: Record<string, DestinationCuratedContent> = {
  'Rio de Janeiro': {
    headline: 'A Cidade Maravilhosa entre o oceano atlântico e montanhas imponentes',
    description: 'O Rio de Janeiro é uma celebração de sol, cultura vibrante e natureza colossal. De Copacabana e Ipanema ao topo do Corcovado, cada recanto respira música, arte e hospitalidade. Conheça a Floresta da Tijuca, o lendário pôr do sol no Arpoador e a efervescência noturna da Lapa.',
    bestTime: 'Maio a Outubro (clima ameno, céu límpido e pouca chuva)',
    bestTimeMonths: ['NORMAL', 'NORMAL', 'NORMAL', 'GOOD', 'BEST', 'BEST', 'BEST', 'BEST', 'BEST', 'BEST', 'GOOD', 'NORMAL'],
    topAttractions: ['Cristo Redentor', 'Pão de Açúcar', 'Praia de Ipanema', 'Jardim Botânico', 'Arcos da Lapa', 'Escadaria Selarón'],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?q=80&w=800&auto=format&fit=crop', title: 'Cristo Redentor e Baía de Guanabara' },
      { url: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?q=80&w=800&auto=format&fit=crop', title: 'Orla de Copacabana e Ipanema' },
      { url: 'https://images.unsplash.com/photo-1544989164-31dc3c645987?q=80&w=800&auto=format&fit=crop', title: 'Pão de Açúcar ao Entardecer' },
      { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop', title: 'Centro Histórico e Lapa' }
    ]
  },
  'Paris': {
    headline: 'A capital mundial da elegância, alta gastronomia e história milenar',
    description: 'Paris encanta em cada esquina com seus boulevards monumentais, cafés charmosos e tesouros artísticos incomparáveis. Da silhueta inesquecível da Torre Eiffel às galerias infinitas do Louvre, caminhar às margens do Sena é vivenciar séculos de cultura refinada.',
    bestTime: 'Abril a Junho e Setembro a Novembro (primavera e outono com clima agradável)',
    bestTimeMonths: ['NORMAL', 'NORMAL', 'GOOD', 'BEST', 'BEST', 'BEST', 'GOOD', 'GOOD', 'BEST', 'BEST', 'GOOD', 'NORMAL'],
    topAttractions: ['Torre Eiffel', 'Museu do Louvre', 'Catedral de Notre-Dame', 'Basílica de Sacré-Cœur', 'Palácio de Versalhes', 'Panteão'],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop', title: 'Torre Eiffel' },
      { url: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=800&auto=format&fit=crop', title: 'Rio Sena e Pontes Históricas' },
      { url: 'https://images.unsplash.com/photo-1520939817895-060bdef4ad1b?q=80&w=800&auto=format&fit=crop', title: 'Museu do Louvre' },
      { url: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?q=80&w=800&auto=format&fit=crop', title: 'Montmartre e Sacré-Cœur' }
    ]
  },
  'Fernando de Noronha': {
    headline: 'Santuário ecológico de águas cristalinas e vida marinha protegida',
    description: 'Considerado um dos arquipélagos mais preservados do mundo, Noronha oferece praias eleitas entre as mais bonitas do planeta, como a Baía do Sancho e a Baía dos Porcos. Um refúgio singular para mergulho entre tartarugas, arraias e golfinhos sob estrito cuidado ambiental.',
    bestTime: 'Agosto a Fevereiro (mar espelhado e visibilidade aquática de até 50 metros)',
    bestTimeMonths: ['BEST', 'BEST', 'NORMAL', 'NORMAL', 'NORMAL', 'NORMAL', 'GOOD', 'BEST', 'BEST', 'BEST', 'BEST', 'BEST'],
    topAttractions: ['Baía do Sancho', 'Baía dos Porcos', 'Praia do Leão', 'Projeto Tamar', 'Forte de Nossa Senhora dos Remédios', 'Cacimba do Padre'],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1589556264800-08ae9e129a8c?q=80&w=800&auto=format&fit=crop', title: 'Morro Dois Irmãos' },
      { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop', title: 'Baía do Sancho' },
      { url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800&auto=format&fit=crop', title: 'Mergulho com Vida Marinha' },
      { url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=800&auto=format&fit=crop', title: 'Pôr do Sol no Boldró' }
    ]
  },
  'Bonito': {
    headline: 'A capital brasileira do ecoturismo e nascentes de transparência absoluta',
    description: 'Bonito é mundialmente consagrado por rios de calcário tão límpidos que parecem aquários naturais gigantescos. Flutue ao lado de dezenas de espécies de peixes, aventure-se em grutas com lagos azul-turquesa e encante-se com cachoeiras de tirar o fôlego.',
    bestTime: 'Maio a Agosto (águas com máxima transparência) ou Dezembro a Março (cachoeiras caudalosas)',
    bestTimeMonths: ['GOOD', 'GOOD', 'GOOD', 'GOOD', 'BEST', 'BEST', 'BEST', 'BEST', 'GOOD', 'GOOD', 'GOOD', 'GOOD'],
    topAttractions: ['Gruta do Lago Azul', 'Flutuação no Rio Sucuri', 'Aquário Natural', 'Abismo Anhumas', 'Parque das Cachoeiras', 'Buraco das Araras'],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800&auto=format&fit=crop', title: 'Flutuação em Águas Cristalinas' },
      { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop', title: 'Cachoeiras da Serra da Bodoquena' },
      { url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop', title: 'Grutas Naturais de Calcário' },
      { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800&auto=format&fit=crop', title: 'Trilhas na Mata Ciliar' }
    ]
  },
  'Reykjavik': {
    headline: 'A terra do gelo e do fogo iluminada pelas cores da Aurora Boreal',
    description: 'Reykjavik é a porta de entrada para paisagens míticas: campos de lava cobertos por musgo ancestral, fontes termais fumegantes, vulcões ativos, cascatas gigantescas e o balé luminoso da Aurora Boreal no céu do norte ártico.',
    bestTime: 'Setembro a Março (temporada de Aurora Boreal) ou Junho a Agosto (Sol da Meia-Noite)',
    bestTimeMonths: ['GOOD', 'GOOD', 'GOOD', 'NORMAL', 'NORMAL', 'BEST', 'BEST', 'BEST', 'GOOD', 'GOOD', 'GOOD', 'GOOD'],
    topAttractions: ['Blue Lagoon (Lagoa Azul)', 'Igreja Hallgrímskirkja', 'Harpa Concert Hall', 'Cachoeira Gullfoss', 'Gêiseres de Haukadalur', 'Parque Nacional Thingvellir'],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?q=80&w=800&auto=format&fit=crop', title: 'Aurora Boreal na Islândia' },
      { url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=800&auto=format&fit=crop', title: 'Cachoeira Gullfoss e Glaciares' },
      { url: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?q=80&w=800&auto=format&fit=crop', title: 'Campos Geotermais e Lagoas' },
      { url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop', title: 'Praias de Areia Negra' }
    ]
  },
  'Machu Picchu': {
    headline: 'A cidade sagrada dos Incas erguida entre as nuvens dos Andes',
    description: 'Empoleirada a mais de 2.400 metros de altitude, Machu Picchu transcende o tempo com sua engenharia milenar de pedra e sua aura de mistério. Cercada por desfiladeiros vertiginosos e florestas nebulares, é uma experiência transformadora.',
    bestTime: 'Maio a Outubro (período seco com trilhas límpidas e dias ensolarados)',
    bestTimeMonths: ['NORMAL', 'NORMAL', 'NORMAL', 'GOOD', 'BEST', 'BEST', 'BEST', 'BEST', 'BEST', 'BEST', 'GOOD', 'NORMAL'],
    topAttractions: ['Templo do Sol', 'Pico Huayna Picchu', 'Intihuatana (Pedra Sagrada)', 'Templo do Condor', 'Porta do Sol (Inti Punku)', 'Aguan Calientes'],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?q=80&w=800&auto=format&fit=crop', title: 'Cidadela de Machu Picchu' },
      { url: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=800&auto=format&fit=crop', title: 'Vale Sagrado dos Incas' },
      { url: 'https://images.unsplash.com/photo-1509299349698-dd22323b5963?q=80&w=800&auto=format&fit=crop', title: 'Trilhas Andinas e Lhamas' },
      { url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop', title: 'Terraços Agrícolas' }
    ]
  },
  'Dubai': {
    headline: 'Oásis ultramoderno onde a imaginação desafia as dunas do deserto',
    description: 'Dubai é o epicentro da ousadia arquitetônica global: o edifício mais alto do planeta, arquipélagos artificiais em formato de palmeira, alta gastronomia internacional e safáris mágicos em meio ao deserto árabe sob estrelas infinitas.',
    bestTime: 'Novembro a Março (temperaturas amenas ideais para passeios ao ar livre)',
    bestTimeMonths: ['BEST', 'BEST', 'BEST', 'GOOD', 'NORMAL', 'NORMAL', 'NORMAL', 'NORMAL', 'NORMAL', 'GOOD', 'BEST', 'BEST'],
    topAttractions: ['Burj Khalifa', 'Dubai Mall', 'Burj Al Arab', 'Dubai Miracle Garden', 'The Dubai Fountain', 'Safari no Deserto Safari'],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=800&auto=format&fit=crop', title: 'Burj Khalifa e Skyline' },
      { url: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?q=80&w=800&auto=format&fit=crop', title: 'Dunas Douradas do Deserto' },
      { url: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?q=80&w=800&auto=format&fit=crop', title: 'Marina de Dubai' },
      { url: 'https://images.unsplash.com/photo-1546412414-e1885259563a?q=80&w=800&auto=format&fit=crop', title: 'Ilhas Palm Jumeirah' }
    ]
  },
  'Tóquio': {
    headline: 'A metrópole fascinante onde templos milenares convivem com o futuro',
    description: 'Tóquio surpreende pelo contraste entre a serenidade dos templos xintoístas e a pulsação tecnológica de Shibuya e Akihabara. Uma capital mundial da gastronomia de precisão, hospitalidade e inovação.',
    bestTime: 'Março a Maio (Florada das Cerejeiras) e Outubro a Novembro (Outono de folhas vermelhas)',
    bestTimeMonths: ['NORMAL', 'NORMAL', 'BEST', 'BEST', 'BEST', 'NORMAL', 'NORMAL', 'NORMAL', 'GOOD', 'BEST', 'BEST', 'GOOD'],
    topAttractions: ['Cruzamento de Shibuya', 'Templo Senso-ji', 'Santuário Meiji', 'Tokyo Skytree', 'Mercado de Tsukiji/Toyosu', 'Jardins Nacionais Shinjuku Gyoen'],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=800&auto=format&fit=crop', title: 'Skyline de Tóquio e Torre de Tóquio' },
      { url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=800&auto=format&fit=crop', title: 'Shibuya Crossing' },
      { url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop', title: 'Templo Senso-ji' },
      { url: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?q=80&w=800&auto=format&fit=crop', title: 'Monte Fuji no Horizonte' }
    ]
  },
  'Patagônia': {
    headline: 'Geleiras colossais e horizontes selvagens nos confins do planeta',
    description: 'No extremo sul do continente, a Patagônia reúne montanhas de granito dramáticas, lagos azul-leitosos alimentados pelo degelo e a estrondosa Geleira Perito Moreno. Um território lendário para caminhantes e apaixonados pela natureza pura.',
    bestTime: 'Novembro a Março (verão austral com dias mais longos e temperaturas agradáveis)',
    bestTimeMonths: ['BEST', 'BEST', 'BEST', 'GOOD', 'NORMAL', 'NORMAL', 'NORMAL', 'NORMAL', 'NORMAL', 'GOOD', 'BEST', 'BEST'],
    topAttractions: ['Glaciar Perito Moreno', 'Parque Nacional Torres del Paine', 'Cerro Fitz Roy', 'Canal Beagle', 'Parque Nacional Los Glaciares', 'Cueva de las Manos'],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?q=80&w=800&auto=format&fit=crop', title: 'Glaciar Perito Moreno' },
      { url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop', title: 'Montanhas da Patagônia' },
      { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop', title: 'Lagos Glaciais' },
      { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800&auto=format&fit=crop', title: 'Pampa Selvagem' }
    ]
  },
  'Atenas': {
    headline: 'O berço da democracia ocidental e da filosofia sob a imponente Acrópole',
    description: 'Atenas respira história viva a cada passo. Com mais de três milênios de civilização, a capital grega fascina com a majestosa Acrópole e o Partenon dominando o horizonte, ruelas pitorescas em Plaka repletas de tabernas tradicionais, gastronomia mediterrânea deliciosa e um pôr do sol inesquecível no Monte Licabeto.',
    bestTime: 'Abril a Junho e Setembro a Novembro (primavera e outono)',
    bestTimeMonths: ['NORMAL', 'NORMAL', 'GOOD', 'BEST', 'BEST', 'BEST', 'GOOD', 'GOOD', 'BEST', 'BEST', 'GOOD', 'NORMAL'],
    topAttractions: ['Acrópole de Atenas', 'Templo do Partenon', 'Bairro de Plaka', 'Museu da Acrópole', 'Templo de Zeus Olímpico', 'Monte Licabeto'],
    gallery: [
      { url: 'assets/atenas.webp', title: 'Acrópole de Atenas' },
      { url: 'https://images.unsplash.com/photo-1555993539-1732b0258235?q=80&w=800&auto=format&fit=crop', title: 'Partenon e Templo de Atena' },
      { url: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=800&auto=format&fit=crop', title: 'Ruas Tradicionais de Plaka' },
      { url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=800&auto=format&fit=crop', title: 'Vista do Monte Licabeto' }
    ]
  },
  'Athens': {
    headline: 'O berço da democracia ocidental e da filosofia sob a imponente Acrópole',
    description: 'Atenas respira história viva a cada passo. Com mais de três milênios de civilização, a capital grega fascina com a majestosa Acrópole e o Partenon dominando o horizonte, ruelas pitorescas em Plaka repletas de tabernas tradicionais, gastronomia mediterrânea deliciosa e um pôr do sol inesquecível no Monte Licabeto.',
    bestTime: 'Abril a Junho e Setembro a Novembro (primavera e outono)',
    bestTimeMonths: ['NORMAL', 'NORMAL', 'GOOD', 'BEST', 'BEST', 'BEST', 'GOOD', 'GOOD', 'BEST', 'BEST', 'GOOD', 'NORMAL'],
    topAttractions: ['Acrópole de Atenas', 'Templo do Partenon', 'Bairro de Plaka', 'Museu da Acrópole', 'Templo de Zeus Olímpico', 'Monte Licabeto'],
    gallery: [
      { url: 'assets/atenas.webp', title: 'Acrópole de Atenas' },
      { url: 'https://images.unsplash.com/photo-1555993539-1732b0258235?q=80&w=800&auto=format&fit=crop', title: 'Partenon e Templo de Atena' },
      { url: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=800&auto=format&fit=crop', title: 'Ruas Tradicionais de Plaka' },
      { url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=800&auto=format&fit=crop', title: 'Vista do Monte Licabeto' }
    ]
  },
  'Bangkok': {
    headline: 'O pulsar de aromas, templos dourados e a vida intensa das ruas tailandesas',
    description: 'Bangkok é um deleite para os sentidos. Uma metrópole vibrante onde os mercados flutuantes e os majestosos palácios convivem em perfeita harmonia. Aproveite os maravilhosos sabores dos mercados noturnos e a espiritualidade profunda dos templos budistas.',
    bestTime: 'Novembro a Março (clima mais seco e ameno)',
    bestTimeMonths: ['BEST', 'BEST', 'BEST', 'NORMAL', 'NORMAL', 'NORMAL', 'NORMAL', 'NORMAL', 'NORMAL', 'GOOD', 'BEST', 'BEST'],
    topAttractions: ['Grande Palácio Real', 'Templo do Buda de Esmeralda (Wat Phra Kaew)', 'Wat Arun (Templo do Amanhecer)', 'Mercado Chatuchak', 'Khaosan Road', 'Mercado Flutuante Damnoen Saduak'],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1583491470869-2782ccfbbaac?q=80&w=800&auto=format&fit=crop', title: 'Wat Arun' },
      { url: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?q=80&w=800&auto=format&fit=crop', title: 'Tuk-Tuk em Bangkok' },
      { url: 'https://images.unsplash.com/photo-1558980394-0a37b360875e?q=80&w=800&auto=format&fit=crop', title: 'Mercado Noturno' },
      { url: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?q=80&w=800&auto=format&fit=crop', title: 'Palácio Real' }
    ]
  },
  'Bogotá': {
    headline: 'Capital da altitude com uma rica história colonial e renascimento artístico',
    description: 'Situada a 2.640 metros de altitude, Bogotá é uma cidade de contrastes deslumbrantes. Encante-se com o charmoso bairro histórico de La Candelaria, o impressionante Museu do Ouro e a vibrante cultura artística de rua, além da deslumbrante vista do topo do Cerro Monserrate.',
    bestTime: 'Dezembro a Março (estação seca)',
    bestTimeMonths: ['BEST', 'BEST', 'BEST', 'GOOD', 'NORMAL', 'NORMAL', 'NORMAL', 'NORMAL', 'NORMAL', 'GOOD', 'GOOD', 'BEST'],
    topAttractions: ['Cerro Monserrate', 'La Candelaria', 'Museo del Oro', 'Plaza de Bolívar', 'Museo Botero', 'Jardín Botánico de Bogotá'],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?q=80&w=800&auto=format&fit=crop', title: 'La Candelaria' },
      { url: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?q=80&w=800&auto=format&fit=crop', title: 'Monserrate' },
      { url: 'https://images.unsplash.com/photo-1589330694653-0c4a9d70085a?q=80&w=800&auto=format&fit=crop', title: 'Museo del Oro' },
      { url: 'https://images.unsplash.com/photo-1592922757262-b7e8d697818e?q=80&w=800&auto=format&fit=crop', title: 'Arte de Rua em Bogotá' }
    ]
  },
  'Istambul': {
    headline: 'A mágica ponte que une o oriente e o ocidente em esplendor histórico',
    description: 'Banhada pelo Bósforo, Istambul é onde Europa e Ásia se encontram. Uma metrópole inebriante repleta de mesquitas impressionantes, palácios otomanos, o labirinto de aromas e cores do Grande Bazar e o chamado melodioso à oração ao entardecer.',
    bestTime: 'Abril a Maio e Setembro a Outubro (clima agradável)',
    bestTimeMonths: ['NORMAL', 'NORMAL', 'GOOD', 'BEST', 'BEST', 'GOOD', 'GOOD', 'GOOD', 'BEST', 'BEST', 'GOOD', 'NORMAL'],
    topAttractions: ['Hagia Sophia (Santa Sofia)', 'Mesquita Azul', 'Palácio Topkapi', 'Grande Bazar', 'Cisterna da Basílica', 'Torre de Gálata'],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?q=80&w=800&auto=format&fit=crop', title: 'Mesquita Azul' },
      { url: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=800&auto=format&fit=crop', title: 'Hagia Sophia' },
      { url: 'https://images.unsplash.com/photo-1526628608822-6b941f1ea124?q=80&w=800&auto=format&fit=crop', title: 'Estreito do Bósforo' },
      { url: 'https://images.unsplash.com/photo-1601224953906-816d7a46c75a?q=80&w=800&auto=format&fit=crop', title: 'Bazar das Especiarias' }
    ]
  },
  'Madri': {
    headline: 'Coração pulsante da Espanha, famosa por sua energia vibrante e praças grandiosas',
    description: 'A capital espanhola é apaixonante e interminável. Repleta de coleções de arte espetaculares no Triângulo de Ouro, parques frondosos, e uma vida noturna contagiante regada a tapas deliciosas e espetáculos de flamenco inesquecíveis.',
    bestTime: 'Maio a Junho e Setembro a Outubro (primavera e outono espanhol)',
    bestTimeMonths: ['NORMAL', 'NORMAL', 'GOOD', 'GOOD', 'BEST', 'BEST', 'NORMAL', 'NORMAL', 'BEST', 'BEST', 'GOOD', 'NORMAL'],
    topAttractions: ['Museu do Prado', 'Parque do Retiro', 'Palácio Real de Madri', 'Plaza Mayor', 'Puerta del Sol', 'Estádio Santiago Bernabéu'],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?q=80&w=800&auto=format&fit=crop', title: 'Palácio Real' },
      { url: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?q=80&w=800&auto=format&fit=crop', title: 'Plaza Mayor' },
      { url: 'https://images.unsplash.com/photo-1563212882-99a2a7a5a8cd?q=80&w=800&auto=format&fit=crop', title: 'Parque do Retiro' },
      { url: 'https://images.unsplash.com/photo-1512753239209-ce878f793bf0?q=80&w=800&auto=format&fit=crop', title: 'Puerta de Alcalá' }
    ]
  },
  'Sydney': {
    headline: 'A beleza estonteante do porto mais icônico da Austrália',
    description: 'Sydney combina a vibração de uma grande metrópole com praias espetaculares. As silhuetas inconfundíveis da Opera House e da Harbour Bridge complementam dias de surf em Bondi Beach, caminhadas na costa e cruzeiros ao entardecer no cintilante porto.',
    bestTime: 'Setembro a Novembro e Março a Maio (primavera e outono com ótimo clima)',
    bestTimeMonths: ['GOOD', 'GOOD', 'BEST', 'BEST', 'BEST', 'NORMAL', 'NORMAL', 'NORMAL', 'BEST', 'BEST', 'BEST', 'GOOD'],
    topAttractions: ['Sydney Opera House', 'Sydney Harbour Bridge', 'Bondi Beach', 'Darling Harbour', 'Royal Botanic Garden', 'Taronga Zoo'],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=800&auto=format&fit=crop', title: 'Opera House e Harbour Bridge' },
      { url: 'https://images.unsplash.com/photo-1524820197278-540916411e20?q=80&w=800&auto=format&fit=crop', title: 'Bondi Beach' },
      { url: 'https://images.unsplash.com/photo-1574512964344-96695eeac685?q=80&w=800&auto=format&fit=crop', title: 'Vista do Porto de Sydney' },
      { url: 'https://images.unsplash.com/photo-1590518768565-d0c26ebef15b?q=80&w=800&auto=format&fit=crop', title: 'Darling Harbour' }
    ]
  },
  'Toronto': {
    headline: 'A grandiosa e multicultural capital econômica do Canadá',
    description: 'Dinâmica e diversificada, Toronto encanta com seu incrível skyline dominado pela CN Tower e seu multiculturalismo vibrante. Uma cidade de bairros distintos, museus de ponta, as incríveis Ilhas de Toronto e um cenário gastronômico de excelência mundial.',
    bestTime: 'Maio a Setembro (clima ameno e agradável para passeios e festivais)',
    bestTimeMonths: ['NORMAL', 'NORMAL', 'NORMAL', 'GOOD', 'BEST', 'BEST', 'BEST', 'BEST', 'BEST', 'GOOD', 'NORMAL', 'NORMAL'],
    topAttractions: ['CN Tower', 'Royal Ontario Museum (ROM)', 'Toronto Islands', 'St. Lawrence Market', 'Distillery District', 'Aquário Ripley'],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?q=80&w=800&auto=format&fit=crop', title: 'Skyline e CN Tower' },
      { url: 'https://images.unsplash.com/photo-1517090504586-fde19ea6066f?q=80&w=800&auto=format&fit=crop', title: 'Distillery District' },
      { url: 'https://images.unsplash.com/photo-1549471167-2856578aeb8e?q=80&w=800&auto=format&fit=crop', title: 'Lago Ontário' },
      { url: 'https://images.unsplash.com/photo-1579304193309-80b67e2a96dc?q=80&w=800&auto=format&fit=crop', title: 'Ruas Históricas de Toronto' }
    ]
  },
  'Banff': {
    headline: 'Joia das Montanhas Rochosas canadenses com cenários de tirar o fôlego',
    description: 'O Parque Nacional de Banff é a definição de espetáculo natural. Lagos de um azul turquesa impressionante, como o Lake Louise e Moraine Lake, emoldurados por picos nevados e florestas de coníferas. É o destino perfeito para caminhadas de verão e esqui no inverno.',
    bestTime: 'Junho a Agosto (para os lagos derretidos) e Dezembro a Março (para esportes de inverno)',
    bestTimeMonths: ['GOOD', 'GOOD', 'GOOD', 'NORMAL', 'NORMAL', 'BEST', 'BEST', 'BEST', 'GOOD', 'NORMAL', 'NORMAL', 'GOOD'],
    topAttractions: ['Lake Louise', 'Moraine Lake', 'Banff Gondola', 'Icefields Parkway', 'Peyto Lake', 'Johnston Canyon'],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1510255909249-16f39f1c7136?q=80&w=800&auto=format&fit=crop', title: 'Moraine Lake' },
      { url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=800&auto=format&fit=crop', title: 'Lake Louise' },
      { url: 'https://images.unsplash.com/photo-1558500228-4e4b2dcdb21e?q=80&w=800&auto=format&fit=crop', title: 'Montanhas Rochosas' },
      { url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop', title: 'Cenários Nevados de Banff' }
    ]
  },
  'Chapada Diamantina': {
    headline: 'O coração verdejante e colossal das trilhas baianas',
    description: 'Um impressionante oásis montanhoso encravado no sertão da Bahia. A Chapada Diamantina é palco de formações geológicas grandiosas, cachoeiras deslumbrantes como a da Fumaça, vales verdejantes, poços de águas cristalinas azuladas e infinitas trilhas desafiadoras.',
    bestTime: 'Abril a Outubro (menos chuvas e trilhas mais seguras)',
    bestTimeMonths: ['NORMAL', 'NORMAL', 'GOOD', 'BEST', 'BEST', 'BEST', 'BEST', 'BEST', 'BEST', 'BEST', 'GOOD', 'NORMAL'],
    topAttractions: ['Morro do Pai Inácio', 'Cachoeira da Fumaça', 'Poço Azul', 'Cachoeira do Buracão', 'Gruta da Lapa Doce', 'Vale do Pati'],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1601614838634-118029c79e60?q=80&w=800&auto=format&fit=crop', title: 'Morro do Pai Inácio' },
      { url: 'https://images.unsplash.com/photo-1555029415-e2f97c415510?q=80&w=800&auto=format&fit=crop', title: 'Poço Azul' },
      { url: 'https://images.unsplash.com/photo-1588691518336-f33160a28f80?q=80&w=800&auto=format&fit=crop', title: 'Cachoeiras e Trilhas' },
      { url: 'https://images.unsplash.com/photo-1628096350319-32fb45ddc160?q=80&w=800&auto=format&fit=crop', title: 'Vales Gigantes da Chapada' }
    ]
  },
  'Costa Rica': {
    headline: 'Onde o princípio de "Pura Vida" e a biodiversidade reinam absolutos',
    description: 'A Costa Rica é um paraíso tropical autêntico. De praias banhadas por ondas perfeitas do Pacífico a florestas úmidas repletas de tucanos, preguiças e sapos coloridos, até o espetacular vulcão Arenal. Uma imersão profunda na conservação ecológica.',
    bestTime: 'Dezembro a Abril (estação seca, ideial para explorar florestas e praias)',
    bestTimeMonths: ['BEST', 'BEST', 'BEST', 'BEST', 'GOOD', 'NORMAL', 'NORMAL', 'NORMAL', 'NORMAL', 'NORMAL', 'GOOD', 'BEST'],
    topAttractions: ['Parque Nacional Manuel Antonio', 'Vulcão Arenal', 'Reserva Biológica Monteverde', 'Parque Nacional Tortuguero', 'Tamarindo', 'Catarata La Fortuna'],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1518182170546-076616fdcbca?q=80&w=800&auto=format&fit=crop', title: 'Vulcão Arenal' },
      { url: 'https://images.unsplash.com/photo-1534008897995-27a23e859048?q=80&w=800&auto=format&fit=crop', title: 'Fauna Selvagem (Tucanos, Preguiças)' },
      { url: 'https://images.unsplash.com/photo-1549429035-7db60dffbf18?q=80&w=800&auto=format&fit=crop', title: 'Florestas Nebulares de Monteverde' },
      { url: 'https://images.unsplash.com/photo-1570183021111-57c2c1ff7de4?q=80&w=800&auto=format&fit=crop', title: 'Praias Banhadas pelo Pacífico' }
    ]
  },
  'Yellowstone': {
    headline: 'O primeiro parque nacional do mundo, famoso por gêiseres e vida selvagem indomável',
    description: 'Yellowstone é uma maravilha geológica singular no oeste dos Estados Unidos. Um supervulcão ativo que exibe fumarolas, piscinas termais incrivelmente coloridas como a Grand Prismatic Spring e os potentes jorros do Old Faithful, tudo emoldurado por rebanhos de bisões errantes.',
    bestTime: 'Maio a Setembro (quando todas as estradas estão abertas e a fauna é ativa)',
    bestTimeMonths: ['NORMAL', 'NORMAL', 'NORMAL', 'GOOD', 'BEST', 'BEST', 'BEST', 'BEST', 'BEST', 'GOOD', 'NORMAL', 'NORMAL'],
    topAttractions: ['Grand Prismatic Spring', 'Old Faithful Geyser', 'Yellowstone Grand Canyon', 'Mammoth Hot Springs', 'Lago Yellowstone', 'Lamar Valley'],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1504913210419-70a2ea9c7d4d?q=80&w=800&auto=format&fit=crop', title: 'Grand Prismatic Spring' },
      { url: 'https://images.unsplash.com/photo-1582236371759-3fb7e8b83dd4?q=80&w=800&auto=format&fit=crop', title: 'Gêiser Old Faithful' },
      { url: 'https://images.unsplash.com/photo-1563212629-9e19d7d402ce?q=80&w=800&auto=format&fit=crop', title: 'Bisões Livres no Parque' },
      { url: 'https://images.unsplash.com/photo-1447012586736-5afb4d2495ea?q=80&w=800&auto=format&fit=crop', title: 'Grand Canyon of Yellowstone' }
    ]
  }
};

@Component({
  selector: 'app-destination-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './destination-detail-modal.component.html',
  styleUrls: ['./destination-detail-modal.component.scss']
})
export class DestinationDetailModalComponent implements OnInit, OnDestroy {
  @Input({ required: true }) destination!: Destination;
  
  ngOnInit(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open');
      document.documentElement.classList.add('modal-open');
    }
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
    }
  }
  
  private _weather: DestinationWeather | null = null;
  readonly weatherData = signal<DestinationWeather | null>(null);

  @Input()
  set weather(val: DestinationWeather | null) {
    this._weather = val;
    this.weatherData.set(val);
  }
  get weather(): DestinationWeather | null {
    return this._weather;
  }

  @Input() isLoadingWeather = false;

  @Output() close = new EventEmitter<void>();
  @Output() reserve = new EventEmitter<number>();

  placeholderImage = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1200&auto=format&fit=crop';

  // Feature Flag: Galeria de Fotos em Standby para Apresentação do TCC
  // Mude para true quando quiser reativar a galeria inteira!
  showGallery = false;

  curated = computed<DestinationCuratedContent>(() => {
    const name = this.destination?.name || '';
    if (DESTINATION_DETAILS_MAP[name]) {
      return DESTINATION_DETAILS_MAP[name];
    }

    const isEco = (this.destination?.tourismType || '').trim().toUpperCase() === 'ECOTURISMO';
    const city = this.destination?.city || name;
    const country = this.destination?.country || 'Internacional';

    return {
      headline: `${city} — uma jornada extraordinária em ${country}`,
      description: isEco
        ? `${name} é um refúgio ecológico imperdível em ${country}, repleto de paisagens preservadas, biodiversidade fascinante e ar puro. Uma oportunidade única de reconexão profunda com a natureza e experiências ao ar livre inesquecíveis.`
        : `${name} convida você a explorar as riquezas culturais, históricas e urbanas de ${country}. Descubra ruas históricas, alta gastronomia, museus de renome e momentos memoráveis pensados para o seu estilo de viagem.`,
      bestTime: 'Primavera e Outono (temperaturas amenas e melhor circulação)',
      bestTimeMonths: ['NORMAL', 'NORMAL', 'GOOD', 'BEST', 'BEST', 'BEST', 'GOOD', 'GOOD', 'BEST', 'BEST', 'GOOD', 'NORMAL'],
      topAttractions: isEco
        ? [
            `Parque natural de ${city}`,
            `Trilha panorâmica de ${city}`,
            `Reserva ecológica de ${city}`,
            `Cachoeiras e rios de ${city}`,
            `Mirante de ${city}`,
            `Centro de conservação de ${city}`
          ]
        : [
            `Centro histórico de ${city}`,
            `Museu de ${city}`,
            `Mercado central de ${city}`,
            `Parque urbano de ${city}`,
            `Mirante de ${city}`,
            `Roteiro gastronômico de ${city}`
          ],
      gallery: [
        { url: this.destination?.imageUrl || this.placeholderImage, title: `${city} em Destaque` },
        { url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop', title: 'Paisagens Naturais' },
        { url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop', title: 'Exploração e Cultura' },
        { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop', title: 'Cenários Inesquecíveis' }
      ]
    };
  });

  // Calendário Anual Interativo dos 12 Meses (Melhor Época para Visitar)
  bestTimeCalendar = computed(() => {
    const letters = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    const names = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const ratings = this.curated().bestTimeMonths || [
      'NORMAL', 'NORMAL', 'GOOD', 'BEST', 'BEST', 'BEST', 'GOOD', 'GOOD', 'BEST', 'BEST', 'GOOD', 'NORMAL'
    ];

    return letters.map((letter, idx) => ({
      letter,
      fullName: names[idx],
      rating: ratings[idx] || 'NORMAL'
    }));
  });

  forecastPage = signal(0);

  forecastDays = computed(() => {
    const isPolar = this.isPolarDestination();
    const realTemp = this.getRealTemp();
    const realHum = this.getRealHumidity();

    const allDays = Array.from({ length: 16 }, (_, i) => {
      let label = '';
      if (i === 0) label = 'Hoje';
      else if (i === 1) label = 'Amanhã';
      else label = `Em ${i} dias`;
      
      const tempOffset = isPolar 
        ? Math.round(Math.sin(i) * 3 - i * 0.2) 
        : Math.round(Math.sin(i) * 4);
        
      const temp = realTemp + tempOffset;
      const humidity = Math.max(10, Math.min(95, realHum + Math.round(Math.cos(i) * 15)));
      
      const isSunny = !isPolar && temp > 22 && humidity < 60;
      const isRainy = humidity > 65;
      
      let icon = 'bi-cloud-sun-fill';
      if (isPolar) {
        icon = humidity > 60 ? 'bi-cloud-snow-fill' : 'bi-snow';
      } else {
         if (isRainy) icon = 'bi-cloud-rain-fill';
         else if (isSunny) icon = 'bi-sun-fill';
         else icon = 'bi-cloud-fill';
      }

      return { label, temp, humidity, icon, isSunny, isRainy };
    });

    const start = this.forecastPage() * 4;
    const slice = allDays.slice(start, start + 4);

    const temps = slice.map(d => d.temp);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const range = Math.max(1, maxTemp - minTemp);

    return slice.map(d => {
      const ratio = 0.5 + ((d.temp - minTemp) / range) * 0.45;
      return {
        ...d,
        barRatio: ratio.toFixed(2),
        barPercent: Math.round(ratio * 100)
      };
    });
  });

  travelPlanningTip = computed(() => {
    const base = this.destination?.basePrice || 900;
    const country = (this.destination?.country || '').toLowerCase();
    const isNational = country.includes('brasil') || country.includes('brazil');
    const isPolar = this.isPolarDestination();
    const isEco = this.isEcoDestination();

    let daysLabel = '5 a 7 dias';
    let multiplier = 2.6;

    if (isPolar) {
      daysLabel = '7 a 10 dias';
      multiplier = 2.2;
    } else if (isNational) {
      daysLabel = isEco ? '4 a 6 dias' : '4 a 5 dias';
      multiplier = 3.2;
    } else {
      daysLabel = '6 a 8 dias';
      multiplier = 2.5;
    }

    const rawSuggested = Math.round((base * multiplier) / 100) * 100;
    const suggestedBudget = Math.max(base + 800, rawSuggested);

    return {
      daysLabel,
      suggestedBudget: this.formatPrice(suggestedBudget),
      dailyEstimate: this.formatPrice(Math.round((suggestedBudget - base) / 5))
    };
  });

  nextForecastPage() {
    if (this.forecastPage() < 3) {
      this.forecastPage.update(p => p + 1);
    }
  }

  prevForecastPage() {
    if (this.forecastPage() > 0) {
      this.forecastPage.update(p => p - 1);
    }
  }

  isPolarDestination(): boolean {
    const name = (this.destination?.name || '').toLowerCase();
    const city = (this.destination?.city || '').toLowerCase();
    const country = (this.destination?.country || '').toLowerCase();
    return name.includes('antártida') || name.includes('antarctica') || name.includes('reykjavik') || city.includes('antártida') || country.includes('antártida');
  }

  isEcoDestination(): boolean {
    return (this.destination?.tourismType || '').trim().toUpperCase() === 'ECOTURISMO';
  }

  destinationAccent(): string {
    return this.isEcoDestination() ? '#65A30D' : '#5BA4D8';
  }

  destinationAccentBorder(): string {
    return this.isEcoDestination() ? '#3F6600' : '#266892';
  }

  tourismTypeLabel(): string {
    const type = (this.destination?.tourismType || '').trim();
    if (!type) return '';
    if (type.toUpperCase() === 'COMUM') return 'Viagem comum';
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  }

  getRealTemp(): number {
    const w = this.weatherData();
    const fMax = w?.forecast?.maxTemperature;
    if (fMax !== undefined && fMax !== null) {
      return Math.round(fMax);
    }
    const hMax = w?.historicalContext?.maxTemperature;
    if (hMax !== undefined && hMax !== null) {
      return Math.round(hMax);
    }
    return this.isPolarDestination() ? -12 : 26;
  }

  getRealHumidity(): number {
    const w = this.weatherData();
    if (w?.forecast?.precipitationProbabilityPercent !== undefined && w?.forecast?.precipitationProbabilityPercent !== null) {
      return w.forecast.precipitationProbabilityPercent;
    }
    if (w?.historicalContext?.rainyDaysCount !== undefined && w?.historicalContext?.rainyDaysCount !== null) {
      return Math.min(90, Math.max(10, w.historicalContext.rainyDaysCount * 4));
    }
    return this.isPolarDestination() ? 78 : 35;
  }

  apparentTemp(): number {
    const w = this.weatherData();
    const app = w?.forecast?.apparentTemperature;
    if (app !== undefined && app !== null) {
      return Math.round(app);
    }
    const hMean = w?.historicalContext?.meanTemperature;
    if (hMean !== undefined && hMean !== null) {
      return Math.round(hMean);
    }
    return this.isPolarDestination() ? -19 : (this.getRealTemp() + 2);
  }

  windSpeed(): number {
    const w = this.weatherData();
    const wind = w?.forecast?.windSpeedKmH;
    if (wind !== undefined && wind !== null) {
      return Math.round(wind);
    }
    const hWind = w?.historicalContext?.avgWindSpeedKmH;
    if (hWind !== undefined && hWind !== null) {
      return Math.round(hWind);
    }
    return this.isPolarDestination() ? 42 : 14;
  }

  weatherCondition(): string {
    if (this.isPolarDestination()) {
      return 'Vento Frio e Neve';
    }
    const w = this.weatherData();
    return w?.forecast?.weatherDescription || w?.historicalContext?.description || 'Tempo Agradável';
  }

  formatPrice(price?: number): string {
    if (price === undefined || price === null) return 'R$ 900,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  }

  onClose(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.close.emit();
  }

  onReserve(): void {
    if (this.destination?.id) {
      this.reserve.emit(this.destination.id);
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.onClose();
  }

  handleImageError(event: any): void {
    event.target.src = this.placeholderImage;
  }
}
