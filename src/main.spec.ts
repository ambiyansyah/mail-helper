import { MailHelper, Config } from './main';
import { requestMailData, parseMailData } from './main.mock';
import axios from 'axios';

let mailHelper: MailHelper;

jest.mock('axios');

// tslint:disable-next-line: typedef
beforeAll(() => {
  const config: Config = {
    sendMailAPI: 'localhost.dev/send',
    minioConfig: {
      endPoint: 'play.min.io',
      port: 9000,
      useSSL: true,
      accessKey: 'Q3AM3UQ867SPQQA43P2F',
      secretKey: 'zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG',
    },
  };

  mailHelper = new MailHelper(config);

  const mockedAxios = axios as jest.Mocked<typeof axios>;
  mockedAxios.post.mockResolvedValue({
    data: {
      message: 'test',
    },
  });
});

test('should return mail data with attachment', async () => {
  const parseMail = await mailHelper.parseMail(requestMailData);
  expect(parseMail).toStrictEqual(parseMailData);
});

test('should return mail data without attachment', async () => {
  const req = requestMailData;
  const res = parseMailData;
  delete req.attachmentObject;
  delete res.attachment;

  const parseMail = await mailHelper.parseMail(req);
  expect(parseMail).toStrictEqual(res);
});

test('should return success response from API', async () => {
  const res = await mailHelper.sendMail(requestMailData);
  expect(res).toStrictEqual({ message: 'test' });
});
