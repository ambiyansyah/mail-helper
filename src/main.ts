import * as Minio from 'minio';
import * as mime from 'mime';
import { promises as fs } from 'fs';
import axios from 'axios';
import { parse } from 'path';

export interface Config {
  sendMailAPI: string;
  minioConfig: Minio.ClientOptions;
}

export interface MailData {
  from: string;
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
}

export interface RequestMailData extends MailData {
  attachmentObject: {
    bucketName: string;
    objectname: string;
  };
}

export interface AttachmentFile {
  filename: string;
  mimetype: string | null;
  base64: string;
}

export interface ParseMailData extends MailData {
  attachment?: AttachmentFile;
}

export class MailHelper {
  constructor(public config: Config) {
    this.config = config;
  }

  public async sendMail(req: RequestMailData): Promise<any> {
    try {
      const parseMailData: ParseMailData = await this.parseMail(req);
      const res = await axios.post(this.config.sendMailAPI, parseMailData);

      return res.data;
    } catch (err) {
      throw new Error(err.message);
    }
  }

  public async parseMail(req: RequestMailData): Promise<ParseMailData> {
    try {
      let parseMailData: ParseMailData = {
        from: req.from,
        to: req.to,
        cc: req.cc,
        bcc: req.bcc,
        subject: req.subject,
        body: req.body,
      };

      if (req.attachmentObject) {
        const attachment = await this.getAttachmentFile(
          req.attachmentObject.bucketName,
          req.attachmentObject.objectname
        );

        parseMailData = {
          ...parseMailData,
          attachment,
        };
      }

      return parseMailData;
    } catch (err) {
      throw new Error(err.message);
    }
  }

  public async getAttachmentFile(
    bucketName: string,
    objectName: string
  ): Promise<AttachmentFile> {
    try {
      const minioClient = new Minio.Client(this.config.minioConfig);
      const filepath = `/tmp/${objectName}`;

      await minioClient.fGetObject(bucketName, objectName, filepath);

      const filename = filepath.replace(/^.*[\\\/]/, '');
      const mimetype = mime.getType(filepath);
      const base64 = await fs.readFile(filepath, { encoding: 'base64' });
      const result: AttachmentFile = { filename, mimetype, base64 };

      return result;
    } catch (err) {
      throw new Error(err.message);
    }
  }
}
