import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Session, SessionModel } from './session-model';
import {
  createSessionController,
  getAllSessionsController,
  SessionRequest,
} from './sessions-controllers';

jest.mock('@supabase/supabase-js', () => {
  const data = {
    publicUrl: 'https://example.com/photo.webp',
  };
  return {
    createClient: jest.fn().mockImplementation(() => ({
      storage: {
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({
            error: null,
            data: {
              ...data,
            },
          }),
          getPublicUrl: jest.fn().mockReturnValue({
            error: null,
            data: {
              ...data,
            },
          }),
        }),
      },
    })),
  };
});

describe('Given a controller to create sessions,', () => {
  const mockResponse = {
    json: jest.fn(),
    status: jest.fn().mockReturnThis(),
    locals: { id: 'mockId' },
  } as Partial<Response<Session | { message: string }, { id: string }>>;

  const next = jest.fn();

  const session = {
    title: 'mockSession',
    coverImageURL: 'https://example.com/photo.webp',
    url: '',
    queuedSongs: [],
    admin: 'mockUserId',
    participants: [],
    _id: 'mockSessionId',
  };

  SessionModel.create = jest.fn().mockResolvedValue(session);

  test('when the user tries to create a session without a title, it should pass on an error', async () => {
    const invalidMockRequest = {
      body: {
        title: '',
      },
      file: { buffer: Buffer.from('mockBuffer') },
    } as unknown as Partial<Request>;

    await createSessionController(
      invalidMockRequest as Request<
        unknown,
        Session | { message: string },
        SessionRequest,
        unknown,
        { id: string }
      >,
      mockResponse as Response<Session | { message: string }, { id: string }>,
      next,
    );

    expect(next).toHaveBeenCalled();
  });

  test('when the user does not upload an image, the session should be created with a default image', async () => {
    const invalidMockRequest = {
      body: {
        title: 'mockTitle',
      },
      file: { buffer: undefined },
    } as unknown as Partial<Request>;

    await createSessionController(
      invalidMockRequest as Request<
        unknown,
        Session | { message: string },
        SessionRequest,
        unknown,
        { id: string }
      >,
      mockResponse as Response<Session | { message: string }, { id: string }>,
      next,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(201);
  });

  test('when the user uploads an image and provides a title, it should create a session', async () => {
    const mockRequest = {
      body: {
        title: 'sessionTitle',
      },
      file: { buffer: Buffer.from('mockBuffer') },
    } as Partial<Request>;

    await createSessionController(
      mockRequest as Request<
        unknown,
        Session | { message: string },
        SessionRequest,
        unknown,
        { id: string }
      >,
      mockResponse as Response<Session | { message: string }, { id: string }>,
      next,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(201);
  });
});

describe('Given a controller to get all sessions,', () => {
  const mockRequest = {} as Partial<Request>;

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as Partial<Response>;

  const next = jest.fn();

  const sessions = {
    _id: new mongoose.Types.ObjectId('123456789123456789123456'),
    title: 'mockSession',
    coverImageURL: 'mockCover',
    url: 'mockUrl',
    queuedSongs: [],
    admin: 'mockUser',
    participants: [],
  };

  test('when the database response is successful, the user should receive a list of sessions', async () => {
    SessionModel.find = jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(sessions) });

    await getAllSessionsController(
      mockRequest as Request,
      mockResponse as Response,
      next,
    );

    expect(mockResponse.json).toHaveBeenCalledWith(sessions);
  });

  test('when an error is thrown, it should be passed on to be handled', async () => {
    SessionModel.find = jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockRejectedValue(null) });

    await getAllSessionsController(
      mockRequest as Request,
      mockResponse as Response,
      next,
    );

    expect(next).toHaveBeenCalled();
  });
});
