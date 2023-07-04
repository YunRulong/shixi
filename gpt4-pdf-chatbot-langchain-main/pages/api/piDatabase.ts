import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { makeChain } from '@/utils/makechain';
import { pinecone } from '@/utils/pinecone-client';
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '@/config/pinecone';
//轉碼部分
import { Document } from 'langchain/document';
import { readFile } from 'fs/promises';
import { BaseDocumentLoader } from 'langchain/document_loaders';
//上傳部分
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { CustomPDFLoader } from '@/utils/customPDFLoader';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';

import type { DeleteOperationRequest, Delete1Request, DescribeIndexStatsOperationRequest, FetchRequest, QueryOperationRequest, UpdateOperationRequest, UpsertOperationRequest, VectorOperationsApi} from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch/apis/VectorOperationsApi.js';
import type { DeleteRequest, DescribeIndexStatsRequest, DescribeIndexStatsResponse, FetchResponse, QueryRequest, QueryResponse, UpdateRequest, UpsertRequest, UpsertResponse } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch/models/index.js';
import type { QueryVector } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch/models/QueryVector.js';
import { timeLog } from 'console';

export class PiDatabase
{

    static March = async (role:string,key:string="",limit:number=10000,datas: Array<any>=[]):Promise<Array<any>>=> {
        //role角色名
        //limit匹配數，上限10000
        //datas用於存返回值的參數，勿填
        //matedata裏的對應字段
        let pinecone_name_space=""// 声明 pinecone_name_space，用于存储命名空间名字
        pinecone_name_space=PINECONE_NAME_SPACE // 先取默认值
        if(role!=""&&role!=null)pinecone_name_space=role// 输入非空则使用输入值作为命名空间名字

        
        try {
            const index = pinecone.Index(PINECONE_INDEX_NAME);// 从松果（pinecone）获取对应的索引区域
            const val: QueryVector={
            values: Array<number>(1536).fill(0) // 创建一个长度为 1536 的数组并填充为 0，作为 QueryVector 对象的 values 属性
            }
            const arr:Array<QueryVector>=[val]// 创建一个包含上面创建的 QueryVector 对象的数组
            const quu: QueryRequest={
            topK: limit, // 设置返回结果的数量上限为 10000，即無限制（松果最大上限也就是10000）
            namespace: pinecone_name_space,// 设置命名空间名字
            includeMetadata: true, // 请求结果中包含元数据
            queries: arr // 设置查询请求的 QueryVector 数组
            };
            const qu: QueryOperationRequest={
            queryRequest: quu // 将 QueryRequest 对象赋值给 QueryOperationRequest 的 queryRequest 属性
            };
            const que = await index.query(qu)// 发送查询请求并等待返回结果
            que.results?.map((result) => result.matches?.map((result)=>{
                if(key==null){
                    if(result.metadata)
                    datas.push(result.metadata); // 将结果中的 metadata.source 字段的值加入 datas 数组
                }
                else if(
                    result.metadata&&
                    key in result.metadata&&
                    typeof(result.metadata[key as keyof typeof result.metadata])=='string')
                        datas.push(result.metadata[key as keyof typeof result.metadata]); // 将结果中的 metadata.source 字段的值加入 datas 数组
                else console.log(key,' is unfound');
            }))

        } catch (error) {
            console.log('error', error);
            throw new Error('Failed to march your data');// 抛出异常，提示获取数据失败
        }
        return new Promise<Array<any>>((resolve,reject)=>{
            setTimeout(()=>{
            const data: Array<any>= datas; // 将 datas 数组作为结果返回
            resolve(data);
            },2000);
        });
        };
    static Creat = async (role:string="",record:PiRecord) => {
    try {

        let pine_conne_space=PINECONE_NAME_SPACE
        if(role!=""||role!=null)
        {
            pine_conne_space=role;
        }

        const docs = await DocumentCreat(record);
        console.log('record', docs);
    
        console.log('creating vector store...');
        /*create and store the embeddings in the vectorStore*/
        const embeddings = new OpenAIEmbeddings();
        const index = pinecone.Index(PINECONE_INDEX_NAME); //change to your own index name
    
        //embed the PDF documents
        await PineconeStore.fromDocuments(docs, embeddings, {
            pineconeIndex: index,
            namespace: pine_conne_space,
            textKey: 'text',
        });
        } catch (error) {
        console.log('error', error);
        throw new Error('Failed to creat your data');
        }
    };
    static Delete = async (role:string,id:string[])=> {
        let pinecone_name_space=""// 声明 pinecone_name_space，用于存储命名空间名字
        // 避免誤刪，不取默认值
        if(role!=""&&role!=null)pinecone_name_space=role// 输入非空则使用输入值作为命名空间名字
        
        try {
            const val: QueryVector={
                values: Array<number>(1536).fill(0) // 创建一个长度为 1536 的数组并填充为 0，作为 QueryVector 对象的 values 属性
            }
                const arr:Array<QueryVector>=[val]// 创建一个包含上面创建的 QueryVector 对象的数组
                const quu: DeleteRequest={
                ids:id,
                deleteAll:false,
                namespace: pinecone_name_space,// 设置命名空间名字
            };
            const index = pinecone.Index(PINECONE_INDEX_NAME);// 从松果（pinecone）获取对应的索引区域
            await index.delete1(quu)// 发送查询请求并等待返回结果
            console.log('delete record successed');

        } catch (error) {
            console.log('error', error);
            throw new Error('Failed to delete record ');// 抛出异常，提示获取数据失败
        }
    };
    static BatchCreat = async (role:string="",record:Array<PiRecord>) => {
    try {
    
            let pine_conne_space=PINECONE_NAME_SPACE
            if(role!=""||role!=null)
            {
                pine_conne_space=role;
            }
            const docs = await BatchDocumentCreat(record);
            console.log('record', docs);
        
            console.log('creating vector store...');
            /*create and store the embeddings in the vectorStore*/
            const embeddings = new OpenAIEmbeddings();
            const index = pinecone.Index(PINECONE_INDEX_NAME); //change to your own index name
        
            //embed the PDF documents
            await PineconeStore.fromDocuments(docs, embeddings, {
                pineconeIndex: index,
                namespace: pine_conne_space,
                textKey: 'text',
            });
            } catch (error) {
            console.log('error', error);
            throw new Error('Failed to creat your data');
            }
    };
    static DeleteNameSpace = async (role:string)=> {
        let pinecone_name_space=""// 声明 pinecone_name_space，用于存储命名空间名字
        // 避免誤刪，不取默认值
        if(role!=""&&role!=null)pinecone_name_space=role// 输入非空则使用输入值作为命名空间名字
        
        try {
            const val: QueryVector={
                values: Array<number>(1536).fill(0) // 创建一个长度为 1536 的数组并填充为 0，作为 QueryVector 对象的 values 属性
            }
                const arr:Array<QueryVector>=[val]// 创建一个包含上面创建的 QueryVector 对象的数组
                const quu: DeleteRequest={
                deleteAll:true,
                namespace: pinecone_name_space,// 设置命名空间名字
            };
            const index = pinecone.Index(PINECONE_INDEX_NAME);// 从松果（pinecone）获取对应的索引区域
            await index.delete1(quu)// 发送查询请求并等待返回结果
            console.log('delete namespace: "'+ role+'" successed');

        } catch (error) {
            console.log('error', error);
            throw new Error('Failed to delete your namespace: "'+ role+'"');// 抛出异常，提示获取数据失败
        }
    };
}
async function DocumentCreat(record:PiRecord):Promise<Document[]>
{
    let metadata: Record<string, string>;
    metadata={ role: record.role }

    return  [
        new Document({
        pageContent: record.message,
        metadata: {
            ...metadata,
        },
        }),
    ];
}
async function BatchDocumentCreat(records:Array<PiRecord>):Promise<Document[]>
{
    let Docs: Array<Document>=[];
    for(let i=0;i<records.length;i++)
    {
        let metadata: Record<string, string>;
        metadata={ role: records[i].role }
        Docs.push(
            new Document({
                pageContent: records[i].message,
                metadata: {
                    ...metadata,
                },
                }),
        )
    }
    return Docs;
}
export class PiRecord{
    record: Record<string, any>;
    role: string;
    message: string;
    constructor(role:string,message:string){
        this.record={};
        this.role=role;
        this.message=message;
    };
}

