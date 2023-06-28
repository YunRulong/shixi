import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { makeChain } from '@/utils/makechain';
import { pinecone } from '@/utils/pinecone-client';
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '@/config/pinecone';
import { run } from 'scripts/ingest-data';
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    try {
        const myresponse = 'xzwhhh';

        await (async () => {
            await run();
            console.log('ingestion complete');
        })();

        res.status(200).json(myresponse);
    } catch (error: any) {
        console.log('error', error);
        res.status(500).json({ error: error.message || 'Something went wrong' });
    }
}
