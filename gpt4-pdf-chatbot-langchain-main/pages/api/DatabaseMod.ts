import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { makeChain } from '@/utils/makechain';
import { pinecone } from '@/utils/pinecone-client';
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '@/config/pinecone';
import { AlignHorizontalDistributeCenterIcon } from 'lucide-react';



export default async function contextMatch (
    question : string,
    uuid : string,
    datas: Array<any>=[] 
    ) {
        let pinecone_name_space = ''
        if(uuid!=""&&uuid!=null)pinecone_name_space=uuid

        console.log('uuid', uuid);
        console.log('question', question);

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
      chat_history: [],
    });

    response.sourceDocuments?.map((result:object) => {if('pageContent' in result )datas.push(result.pageContent)});

    
   
  } catch (error: any) {
    console.log('error in cite', error);
  }

  return new Promise<Array<any>>((resolve,reject)=>{
    setTimeout(()=>{
    const data: Array<any>= datas; // 将 datas 数组作为结果返回
    resolve(data);
    },2000);
});
}