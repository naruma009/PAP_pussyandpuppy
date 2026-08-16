import { EN_ANSWERS, MOODS, QUESTION_POOLS } from "./personalityData";
import { randomItem } from "./mascotBehavior";

export function randomBetween(minimum, maximum, random = Math.random) { return minimum + Math.floor(random() * (maximum - minimum + 1)); }
export function sampleQuestions(questions, count = 3, random = Math.random) { const pool = [...questions]; for (let index = pool.length - 1; index > 0; index--) { const target = Math.floor(random() * (index + 1)); [pool[index], pool[target]] = [pool[target], pool[index]]; } return pool.slice(0, count); }
export function questionsFor(species, language, random = Math.random) { return sampleQuestions(QUESTION_POOLS[species], 3, random).map((question) => language === "en" ? { ...question, text:question.en, answers:question.answers.map((answer, index) => ({ ...answer, text:EN_ANSWERS[answer.mood][index % EN_ANSWERS[answer.mood].length] })) } : question); }
export function moodResult(species, answers, random = Math.random) { const scores = answers.reduce((all, answer) => { all[answer.mood] = (all[answer.mood] || 0) + answer.weight; return all; }, {}); const best = Math.max(...Object.values(scores)); const candidates = Object.keys(scores).filter((key) => scores[key] >= best - 1); const key = randomItem(candidates, random); return { key, scores, candidates, ...MOODS[species][key] }; }
export function recommendedProducts(products, species, categories) { return products.filter((product) => categories.includes(product.category) && (product.petType === species || product.petType === "both")).slice(0, 3); }
