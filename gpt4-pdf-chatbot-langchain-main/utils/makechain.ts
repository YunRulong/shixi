import { OpenAI } from 'langchain/llms/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { ConversationalRetrievalQAChain } from 'langchain/chains';

const CONDENSE_PROMPT = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`;

const QA_PROMPT = `You are a helpful AI assistant. Use the following pieces of context to answer the question at the end.
If you don't know the answer, just say you don't know. DO NOT try to make up an answer.
If the question is not related to the context, politely respond that you are tuned to only answer questions that are related to the context.

{context}

Question: {question}
Helpful answer in markdown:`;
const CHINESE_CONDENSE_PROMPT= `给定以下对话和一个后续问题，请重新表述后续问题成一个独立的问题。

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`;
const CHINESE_QA_PROMPT = `你是一个乐于助人的AI助手。使用以下上下文片段来回答最后的问题。
如果你不知道答案，直接说不知道即可。请勿尝试编造答案。
如果问题与上下文无关，请礼貌地回答你只回答与上下文相关的问题。

{context}

Question: {question}
Helpful answer in markdown:`;
const CHINESE_ROLE_CONDENSE_PROMPT= `给定以下对话和一个后续对话，请重新表述后续问题成一个独立的对话。

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`;
const CHINESE_ROLE_QA_PROMPT = `以下上下文片段是你曾参与或听过的对话，请总结信息作为依据，并回应最后一句对话。
如果你认为你无法回应这个对话，直接表示拒绝回应对话。
如果你掌握的信息不足以回应这个对话，你可以表现出困惑。

{context}

Question: {question}
Helpful answer in markdown:`;
const TOPK=4
const TEMPERATURE=0.5
export const makeChain = (vectorstore: PineconeStore) => {
  const model = new OpenAI({
    temperature: TEMPERATURE, // increase temepreature to get more creative answers
    modelName: 'gpt-3.5-turbo', //change this to gpt-4 if you have access
  });

  const chain = ConversationalRetrievalQAChain.fromLLM(
    model,
    vectorstore.asRetriever(TOPK),
    {
      qaTemplate: CHINESE_ROLE_QA_PROMPT,
      questionGeneratorTemplate: CHINESE_ROLE_CONDENSE_PROMPT,
      returnSourceDocuments: true, //The number of source documents returned is 4 by default
    },
  );
  return chain;
};