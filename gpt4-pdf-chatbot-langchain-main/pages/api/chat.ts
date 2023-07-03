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
import { Database, Regex } from 'lucide-react';
import {PiDatabase,PiRecord} from './piDatabase';
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
  ///////////////////////////////////////////////////////////////////////////
  //PiDatabase.DeleteNameSpace("pdf-test");
  //PiDatabase.Creat("ERROR",new PiRecord("湯姆","這是我說的話"));
  //let red: Array<PiRecord>=[];
  //for(let i=0;i<20;i++){red.push(new PiRecord("湯姆"+i,"這是第"+i+"個我說的話"))}
  //PiDatabase.BatchCreat("ERROR",red);
  PiDatabase.March("ERROR","role").then((name)=>{console.log("ans:\n",name)}).catch((error)=>{console.log(error)});
  ////////////////////////////////////////////////////////////////////////////
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
  let pinecone_name_space=""// 声明 pinecone_name_space，用于存储命名空间名字
  pinecone_name_space=PINECONE_NAME_SPACE // 先取默认值
  if(uuid!=""&&uuid!=null)pinecone_name_space=uuid// 输入非空则使用输入值作为命名空间名字
  console.log('uuid', uuid);// 打印 uuid 进行检查

  try {
    const index = pinecone.Index(PINECONE_INDEX_NAME);// 从松果（pinecone）获取对应的索引区域

    const val: QueryVector={
      values: Array<number>(1536).fill(0) // 创建一个长度为 1536 的数组并填充为 0，作为 QueryVector 对象的 values 属性
    }
    const arr:Array<QueryVector>=[val]// 创建一个包含上面创建的 QueryVector 对象的数组
    const quu: QueryRequest={
      topK: 10000, // 设置返回结果的数量上限为 10000，即無限制（數據量擴大后需另作調整）
      namespace: pinecone_name_space,// 设置命名空间名字
      includeMetadata: true, // 请求结果中包含元数据
      queries: arr // 设置查询请求的 QueryVector 数组
    };
    const qu: QueryOperationRequest={
      queryRequest: quu // 将 QueryRequest 对象赋值给 QueryOperationRequest 的 queryRequest 属性
    };
    const que = await index.query(qu)// 发送查询请求并等待返回结果
    que.results?.map((result) => result.matches?.map((result)=>{
      if(result.metadata)
        if("source" in result.metadata)
          if(typeof(result.metadata.source)=='string')
            datas.push(result.metadata.source); // 将结果中的 metadata.source 字段的值加入 datas 数组
    }))
    const tdata:Array<string>=[]
    datas.map((na)=>{tdata.push(na.split(new RegExp('\\\\|/'))[na.split(new RegExp('\\\\|/')).length-1]);})// 提取路径中的文件名，并将文件名添加到 tdata 数组
    datas=tdata;// 将 tdata 赋值给 datas 数组
    //console.log('response', response);
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to get your data');// 抛出异常，提示获取数据失败
  }
  return new Promise<Array<string>>((resolve,reject)=>{
    setTimeout(()=>{
      const data: Array<string>= datas; // 将 datas 数组作为结果返回
      resolve(data);
    },2000);
  });
}
        //原來的matadata的結構
        //'loc.lines.from': 1,
        //'loc.lines.to': 3,
        //pdf_numpages: 1,
        //source: 'E:\\GitLib\\xzwDavid\\shixi\\gpt4-pdf-chatbot-langchain-main\\docs\\pdf4.pdf',
        //text: 'Who is jerry?\n\nHe is a cool boy who is going to uiuc University.'