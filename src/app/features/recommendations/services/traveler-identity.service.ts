import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { 
  ProfileResponse, 
  TravelerIdentityState, 
  ProfileOnboardingStatus,
  AttributeDimension, 
  TravelerArchetype, 
  RadarPoint 
} from '../models/traveler-identity.model';
import { UserProfile } from '../../../core/user/models/user.model';

export const ATTRIBUTE_METADATA: Record<string, { label: string; icon: string; category: string; color: string }> = {
  'ECOTURISMO': { label: 'Ecoturismo', icon: 'bi-tree-fill', category: 'Natureza', color: '#0d9488' },
  'NATUREZA': { label: 'Natureza e Trilhas', icon: 'bi-flower1', category: 'Natureza', color: '#059669' },
  'VIDA_SELVAGEM': { label: 'Vida Selvagem', icon: 'bi-binoculars-fill', category: 'Natureza', color: '#16a34a' },
  'PRAIA': { label: 'Praia e Litoral', icon: 'bi-water', category: 'Litoral', color: '#0284c7' },
  'CALOR': { label: 'Clima Tropical', icon: 'bi-sun-fill', category: 'Clima', color: '#d97706' },
  'RELAXAMENTO': { label: 'Descanso e Paz', icon: 'bi-cup-hot-fill', category: 'Lazer', color: '#7c3aed' },
  'CULTURA': { label: 'Cultura e Arte', icon: 'bi-bank', category: 'Cultura', color: '#4f46e5' },
  'HISTORIA': { label: 'História e Tradição', icon: 'bi-hourglass-split', category: 'Cultura', color: '#9333ea' },
  'GASTRONOMIA': { label: 'Gastronomia Local', icon: 'bi-egg-fried', category: 'Culinária', color: '#ea580c' },
  'URBANO': { label: 'Grandes Cidades', icon: 'bi-buildings-fill', category: 'Urbano', color: '#475569' },
  'VIDA_NOTURNA': { label: 'Vida Noturna', icon: 'bi-moon-stars-fill', category: 'Urbano', color: '#db2777' },
  'AVENTURA': { label: 'Aventura ao Ar Livre', icon: 'bi-compass-fill', category: 'Aventura', color: '#dc2626' },
  'MERGULHO': { label: 'Mergulho e Mar', icon: 'bi-tsunami', category: 'Aventura', color: '#0369a1' },
  'MONTANHA': { label: 'Serras e Montanhas', icon: 'bi-triangle-fill', category: 'Natureza', color: '#0f766e' },
  'FRIO': { label: 'Clima de Serra', icon: 'bi-snow', category: 'Inverno', color: '#0284c7' },
  'NEVE': { label: 'Neve e Inverno', icon: 'bi-snow2', category: 'Inverno', color: '#2563eb' },
  'ROMANTICO': { label: 'Roteiros a Dois', icon: 'bi-heart-fill', category: 'Estilo', color: '#e11d48' },
  'LUXO': { label: 'Hospedagem Premium', icon: 'bi-gem', category: 'Estilo', color: '#ca8a04' }
};

export const ID_TO_NAME: Record<number, string> = {
  1: 'FRIO',
  2: 'NEVE',
  3: 'VIDA_SELVAGEM',
  4: 'ECOTURISMO',
  5: 'NATUREZA',
  6: 'PRAIA',
  7: 'CALOR',
  8: 'MERGULHO',
  9: 'RELAXAMENTO',
  10: 'GASTRONOMIA',
  11: 'CULTURA',
  12: 'HISTORIA',
  13: 'VIDA_NOTURNA',
  14: 'URBANO',
  15: 'AVENTURA',
  16: 'ROMANTICO',
  17: 'MONTANHA',
  18: 'LUXO'
};

@Injectable({
  providedIn: 'root'
})
export class TravelerIdentityService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  readonly identityState = signal<TravelerIdentityState | null>(null);

  getTravelerIdentity(): Observable<TravelerIdentityState> {
    return forkJoin({
      explicit: this.http.get<ProfileResponse>(`${this.baseUrl}/profiles/explicit`).pipe(
        catchError(() => of({ hasProfile: false, attributes: [] } as ProfileResponse))
      ),
      behavioral: this.http.get<ProfileResponse>(`${this.baseUrl}/profiles/behavioral`).pipe(
        catchError(() => of({ hasProfile: false, attributes: [] } as ProfileResponse))
      ),
      user: this.http.get<UserProfile>(`${this.baseUrl}/users/me`).pipe(
        catchError(() => of({ name: 'Viajante', budgetPerPerson: null } as UserProfile))
      )
    }).pipe(
      map(data => {
        const state = this.processIdentity(data.explicit, data.behavioral, data.user);
        this.identityState.set(state);
        return state;
      })
    );
  }

  resetAlgorithm(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/profiles/reset`).pipe(
      map(() => {
        this.identityState.set(null);
      })
    );
  }

  private processIdentity(
    explicitRes: ProfileResponse, 
    behavioralRes: ProfileResponse, 
    user: UserProfile
  ): TravelerIdentityState {
    const explicitAttrs = explicitRes?.attributes || [];
    const behavioralAttrs = behavioralRes?.attributes || [];

    const hasExplicitProfile = !!(explicitRes?.hasProfile && explicitAttrs.length > 0);
    const hasBehavioralProfile = !!(behavioralRes?.hasProfile && behavioralAttrs.length > 0);

    let onboardingStatus: ProfileOnboardingStatus = 'NO_QUIZ_NO_FEED';
    if (hasExplicitProfile && hasBehavioralProfile) {
      onboardingStatus = 'COMPLETED';
    } else if (hasExplicitProfile && !hasBehavioralProfile) {
      onboardingStatus = 'QUIZ_ONLY';
    } else if (!hasExplicitProfile && hasBehavioralProfile) {
      onboardingStatus = 'FEED_ONLY';
    } else {
      onboardingStatus = 'NO_QUIZ_NO_FEED';
    }

    const hasProfile = hasExplicitProfile || hasBehavioralProfile;

    const explicitMap = new Map<string, number>();
    for (const a of explicitAttrs) {
      const name = a.attributeName || ID_TO_NAME[Number(a.attributeId)] || String(a.attributeId);
      explicitMap.set(name, Math.max(0, Math.min(1, Number(a.score) || 0)));
    }

    const behavioralMap = new Map<string, number>();
    for (const a of behavioralAttrs) {
      const name = a.attributeName || ID_TO_NAME[Number(a.attributeId)] || String(a.attributeId);
      behavioralMap.set(name, Math.max(0, Math.min(1, Number(a.score) || 0)));
    }

    // Processa todas as dimensões
    const dimensions: AttributeDimension[] = Object.keys(ATTRIBUTE_METADATA).map(name => {
      const meta = ATTRIBUTE_METADATA[name];
      const expScore = explicitMap.get(name) || 0;
      const behScore = behavioralMap.get(name) || 0;
      
      // Regra oficial do Horizon: 60% Quiz + 40% Feed
      const combined = Math.min(1, Math.max(0, (expScore * 0.6) + (behScore * 0.4)));

      return {
        id: name,
        name,
        label: meta.label,
        icon: meta.icon,
        category: meta.category,
        color: meta.color,
        explicitScore: expScore,
        behavioralScore: behScore,
        combinedScore: combined,
        percentage: Math.round(combined * 100)
      };
    });

    // Ordena pelos maiores scores consolidados
    const sortedActiveDimensions = dimensions
      .filter(d => d.explicitScore > 0 || d.behavioralScore > 0)
      .sort((a, b) => b.combinedScore - a.combinedScore);

    const topDimensions = sortedActiveDimensions.length > 0
      ? sortedActiveDimensions.slice(0, 5)
      : [];

    // Determina o Estilo
    const archetype = this.determineArchetype(dimensions);

    // Constrói os dados do Radar Chart Polar (6 eixos)
    const { points, explicitPoly, behavioralPoly, combinedPoly } = this.buildRadarChart(dimensions);

    const synergyScore = this.calculateSynergy(explicitMap, behavioralMap);

    return {
      hasProfile,
      hasExplicitProfile,
      hasBehavioralProfile,
      onboardingStatus,
      userName: user?.name || 'Viajante',
      socialName: user?.socialName || undefined,
      profileImageUrl: user?.profileImageUrl || null,
      budgetPerPerson: user?.budgetPerPerson,
      archetype,
      dimensions,
      topDimensions,
      radarPoints: points,
      explicitPolygon: explicitPoly,
      behavioralPolygon: behavioralPoly,
      combinedPolygon: combinedPoly,
      synergyScore,
      totalExplicitAttributes: explicitAttrs.length,
      totalBehavioralInteractions: behavioralAttrs.length
    };
  }

  private determineArchetype(dimensions: AttributeDimension[]): TravelerArchetype {
    const scoreOf = (name: string) => dimensions.find(d => d.name === name)?.combinedScore || 0;

    const natureScore = Math.max(scoreOf('ECOTURISMO'), scoreOf('NATUREZA'), scoreOf('VIDA_SELVAGEM'));
    const cultureScore = Math.max(scoreOf('CULTURA'), scoreOf('HISTORIA'), scoreOf('GASTRONOMIA'));
    const beachScore = Math.max(scoreOf('PRAIA'), scoreOf('CALOR'), scoreOf('RELAXAMENTO'));
    const urbanScore = Math.max(scoreOf('URBANO'), scoreOf('VIDA_NOTURNA'));
    const winterScore = Math.max(scoreOf('FRIO'), scoreOf('NEVE'));
    const adventureScore = Math.max(scoreOf('AVENTURA'), scoreOf('MERGULHO'), scoreOf('MONTANHA'));

    const archetypes: Array<{ archetype: TravelerArchetype; score: number }> = [
      {
        score: adventureScore,
        archetype: {
          id: 'active-adventure',
          title: 'Aventura ao Ar Livre',
          subtitle: 'Esportes de ação, montanhas e expedições desafiadoras.',
          badge: 'Aventura',
          description: 'Você gosta de viagens movimentadas com passeios desafiadores, trilhas íngremes e contato intenso com a adrenalina.',
          quote: '',
          primaryColor: '#ea580c',
          accentColor: '#c2410c',
          icon: 'bi-compass-fill',
          superpowers: ['Esportes de Ação', 'Mergulho e Mar', 'Expedições']
        }
      },
      {
        score: natureScore,
        archetype: {
          id: 'eco-explorer',
          title: 'Ecoturismo e Natureza',
          subtitle: 'Áreas preservadas, trilhas e turismo sustentável.',
          badge: 'Ecoturismo',
          description: 'Você dá preferência ao contato com a natureza, paisagens verdes e roteiros de ecoturismo. Cidades com cachoeiras, parques ecológicos e contato com a fauna e flora locais combinam diretamente com seu perfil.',
          quote: '',
          primaryColor: '#0d9488',
          accentColor: '#0f766e',
          icon: 'bi-tree-fill',
          superpowers: ['Parques Nacionais e Trilhas', 'Turismo Sustentável', 'Paisagens Naturais']
        }
      },
      {
        score: cultureScore,
        archetype: {
          id: 'cultural-traveler',
          title: 'Cultura e Gastronomia',
          subtitle: 'Cidades históricas, museus e culinária regional.',
          badge: 'Cultura',
          description: 'Você aprecia viagens que trazem história, boa gastronomia e aprendizado. Cidades históricas, museus renomados e restaurantes com culinária autêntica formam a base dos roteiros que mais chamam sua atenção.',
          quote: '',
          primaryColor: '#0284c7',
          accentColor: '#0369a1',
          icon: 'bi-bank',
          superpowers: ['Centros Históricos', 'Gastronomia Regional', 'Museus e Arquitetura']
        }
      },
      {
        score: winterScore,
        archetype: {
          id: 'mountain-winter',
          title: 'Serra e Clima Frio',
          subtitle: 'Cidades serranas, gastronomia típica e inverno.',
          badge: 'Serra',
          description: 'Você se interessa por destinos de montanha, temperaturas amenas e passeios tranquilos. Destinos com arquitetura aconchegante, vinhos locais e paisagens de serra se destacam nas suas preferências.',
          quote: '',
          primaryColor: '#0284c7',
          accentColor: '#2563eb',
          icon: 'bi-snow',
          superpowers: ['Destinos Serranos', 'Gastronomia de Inverno', 'Hospedagens Charme']
        }
      },
      {
        score: beachScore,
        archetype: {
          id: 'beach-lover',
          title: 'Praia e Litoral',
          subtitle: 'Clima tropical, dias ensolarados e mar.',
          badge: 'Litoral',
          description: 'Seu estilo de viagem é voltado para descanso, clima quente e lazer perto do mar. Você prefere orlas agradáveis, praias de águas claras e momentos para recarregar as energias com tranquilidade.',
          quote: '',
          primaryColor: '#0284c7',
          accentColor: '#0891b2',
          icon: 'bi-water',
          superpowers: ['Destinos de Praia', 'Clima Ensolarado', 'Lazer e Descompressão']
        }
      },
      {
        score: urbanScore,
        archetype: {
          id: 'urban-traveler',
          title: 'Metrópoles e Grandes Cidades',
          subtitle: 'Grandes centros urbanos, compras e opções noturnas.',
          badge: 'Urbano',
          description: 'Você aproveita a energia de grandes cidades, vida noturna ativa, cafeterias e eventos culturais. Roteiros cosmopolitas com boa infraestrutura e novidades combinam com o seu ritmo.',
          quote: '',
          primaryColor: '#64748b',
          accentColor: '#475569',
          icon: 'bi-buildings-fill',
          superpowers: ['Grandes Metrópoles', 'Vida Noturna', 'Gastronomia e Compras']
        }
      }
    ];

    archetypes.sort((a, b) => b.score - a.score);

    if (archetypes[0].score >= 0.5) {
      return archetypes[0].archetype;
    }

    return {
      id: 'versatile-traveler',
      title: 'Roteiros Flexíveis',
      subtitle: 'Equilíbrio entre descanso, passeios e cultura.',
      badge: 'Equilibrado',
      description: 'Você possui um perfil variado: gosta de combinar momentos de descanso com passeios culturais e boa gastronomia, aproveitando o que cada destino tem de melhor.',
      quote: '',
      primaryColor: '#0284c7',
      accentColor: '#0369a1',
      icon: 'bi-globe-americas',
      superpowers: ['Roteiros Equilibrados', 'Passeios ao Ar Livre', 'Experiências Locais']
    };
  }

  private buildRadarChart(dimensions: AttributeDimension[]): {
    points: RadarPoint[];
    explicitPoly: string;
    behavioralPoly: string;
    combinedPoly: string;
  } {
    const axes = [
      { key: 'eco', label: 'Ecoturismo e Natureza', attrs: ['ECOTURISMO', 'NATUREZA', 'VIDA_SELVAGEM'] },
      { key: 'cult', label: 'Cultura e História', attrs: ['CULTURA', 'HISTORIA', 'GASTRONOMIA'] },
      { key: 'praia', label: 'Praia e Sol', attrs: ['PRAIA', 'CALOR', 'RELAXAMENTO'] },
      { key: 'urbano', label: 'Metrópole e Noite', attrs: ['URBANO', 'VIDA_NOTURNA'] },
      { key: 'inverno', label: 'Serra e Frio', attrs: ['FRIO', 'NEVE'] },
      { key: 'aventura', label: 'Aventura e Mar', attrs: ['AVENTURA', 'MERGULHO', 'MONTANHA'] }
    ];

    const cx = 160;
    const cy = 160;
    const maxR = 105;
    const totalAxes = axes.length;

    const points: RadarPoint[] = [];
    const expCoords: string[] = [];
    const behCoords: string[] = [];
    const combCoords: string[] = [];

    axes.forEach((axis, i) => {
      const angle = (i * 2 * Math.PI / totalAxes) - (Math.PI / 2);

      let sumExp = 0;
      let sumBeh = 0;
      let count = 0;

      axis.attrs.forEach(attrName => {
        const found = dimensions.find(d => d.name === attrName);
        if (found) {
          sumExp += found.explicitScore;
          sumBeh += found.behavioralScore;
          count++;
        }
      });

      const rawExp = count > 0 ? sumExp / count : 0;
      const rawBeh = count > 0 ? sumBeh / count : 0;

      const expVal = Math.max(0.12, Math.min(1.0, rawExp));
      const behVal = Math.max(0.12, Math.min(1.0, rawBeh));
      const combVal = Math.max(0.15, Math.min(1.0, (rawExp * 0.6) + (rawBeh * 0.4)));

      const expR = maxR * expVal;
      const behR = maxR * behVal;
      const combR = maxR * combVal;

      const explicitX = Math.round((cx + expR * Math.cos(angle)) * 10) / 10;
      const explicitY = Math.round((cy + expR * Math.sin(angle)) * 10) / 10;

      const behavioralX = Math.round((cx + behR * Math.cos(angle)) * 10) / 10;
      const behavioralY = Math.round((cy + behR * Math.sin(angle)) * 10) / 10;

      const combinedX = Math.round((cx + combR * Math.cos(angle)) * 10) / 10;
      const combinedY = Math.round((cy + combR * Math.sin(angle)) * 10) / 10;

      const labelR = maxR + 26;
      const labelX = Math.round((cx + labelR * Math.cos(angle)) * 10) / 10;
      const labelY = Math.round((cy + labelR * Math.sin(angle)) * 10) / 10;

      expCoords.push(`${explicitX},${explicitY}`);
      behCoords.push(`${behavioralX},${behavioralY}`);
      combCoords.push(`${combinedX},${combinedY}`);

      points.push({
        axis: axis.key,
        label: axis.label,
        angle,
        explicitVal: Math.round(rawExp * 100),
        behavioralVal: Math.round(rawBeh * 100),
        combinedVal: Math.round(((rawExp * 0.6) + (rawBeh * 0.4)) * 100),
        explicitX,
        explicitY,
        behavioralX,
        behavioralY,
        combinedX,
        combinedY,
        labelX,
        labelY
      });
    });

    return {
      points,
      explicitPoly: expCoords.join(' '),
      behavioralPoly: behCoords.join(' '),
      combinedPoly: combCoords.join(' ')
    };
  }

  private calculateSynergy(explicitMap: Map<string, number>, behavioralMap: Map<string, number>): number {
    let matches = 0;
    let evaluated = 0;

    explicitMap.forEach((expVal, key) => {
      if (expVal > 0.4) {
        evaluated++;
        const behVal = behavioralMap.get(key) || 0;
        if (behVal > 0.05) {
          matches++;
        }
      }
    });

    if (evaluated === 0) return 85;
    const ratio = matches / evaluated;
    return Math.min(98, Math.max(70, Math.round(72 + ratio * 26)));
  }
}
