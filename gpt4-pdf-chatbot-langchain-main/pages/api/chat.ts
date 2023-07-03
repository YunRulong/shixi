import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { makeChain } from '@/utils/makechain';
import { pinecone } from '@/utils/pinecone-client';
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '@/config/pinecone';

import type { DeleteOperationRequest, Delete1Request, DescribeIndexStatsOperationRequest, FetchRequest, QueryOperationRequest, UpdateOperationRequest, UpsertOperationRequest} from '../../node_modules/@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch/apis/VectorOperationsApi.js';
import type { DeleteRequest, DescribeIndexStatsRequest, DescribeIndexStatsResponse, FetchResponse, QueryRequest, QueryResponse, UpdateRequest, UpsertRequest, UpsertResponse } from '../../node_modules/@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch/models';
import type { QueryVector } from '../../node_modules/@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch/models/QueryVector';
import { resolve } from 'path';
import { Regex } from 'lucide-react';
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { uuid, question, history } = req.body;
  //聲明pinecone_name_space
  let pinecone_name_space=""
  pinecone_name_space=PINECONE_NAME_SPACE
  if(uuid!=""&&uuid!=null)pinecone_name_space=uuid

  console.log('uuid', uuid);
  console.log('question', question);

  //only accept post requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!question) {
    return res.status(400).json({ message: 'No question in the request' });
  }
  // OpenAI recommends replacing newlines with spaces for best results
  const sanitizedQuestion = question.trim().replaceAll('\n', ' ');

  try {
    const index = pinecone.Index(PINECONE_INDEX_NAME);

    /* create vectorstore*/
    const vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings({}),
      {
        pineconeIndex: index,
        textKey: 'text',
        namespace: pinecone_name_space, //namespace comes from your config folder
      },//為替換UUID,插入中間變量
    );
    //getPdfName(pinecone_name_space).then((name)=>{console.log(name)}).catch((error)=>{console.log(error)});
    const chain = makeChain(vectorStore);
    //Ask a question using chat history
    const response = await chain.call({
      question: sanitizedQuestion,
      chat_history: history || [],
    });


    //console.log('response', response);
    res.status(200).json(response);
  } catch (error: any) {
    console.log('error', error);
    res.status(500).json({ error: error.message || 'Something went wrong' });
  }
}
export const getPdfName = async (uuid:string,datas: Array<string>=[]):Promise<Array<string>>=> {//
  //聲明pinecone_name_space
  let pinecone_name_space=""
  pinecone_name_space=PINECONE_NAME_SPACE
  if(uuid!=""&&uuid!=null)pinecone_name_space=uuid
  console.log('uuid', uuid);

  try {
    const index = pinecone.Index(PINECONE_INDEX_NAME);

    const val: QueryVector={
      values: Array<number>(1536).fill(0)
    }
    const arr:Array<QueryVector>=[val]
    const quu: QueryRequest={
      topK: 10000,
      namespace: pinecone_name_space,
      includeMetadata: true,
      queries: arr
    };
    const qu: QueryOperationRequest={
      queryRequest: quu
    };
    const que = await index.query(qu)
    que.results?.map((result) => result.matches?.map((result)=>{if(result.metadata)if("source" in result.metadata)if(typeof(result.metadata.source)=='string')datas.push(result.metadata.source);}))
    const tdata:Array<string>=[]
    datas.map((na)=>{tdata.push(na.split(new RegExp('\\\\|/'))[na.split(new RegExp('\\\\|/')).length-1]);})
    datas=tdata;
    //console.log('response', response);
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to get your data');
  }
  return new Promise<Array<string>>((resolve,reject)=>{
    setTimeout(()=>{
      const data: Array<string>= datas;
      resolve(data);
    },2000);
  });
}
