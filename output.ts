enum HttpMethods {
  HTTP_POST_METHOD = "POST",
  HTTP_GET_METHOD = "GET",
}

enum HttpStatusCodes {
  HTTP_STATUS_OK = 200,
  HTTP_STATUS_INTERNAL_SERVER_ERROR = 500,
}

type UserRoles = "user" | "admin";

interface IUser {
  name: string;
  age: number;
  roles: UserRoles[];
  createdAt: Date;
  isDeleted: boolean;
}

interface IRequest {
  method: HttpMethods;
  host: string;
  path: string;
  body?: IUser;
  params: { [key: string]: string };
}

interface IObserverHandlers {
  next?: (value: IRequest) => void;
  error?: (value: Error) => void;
  complete?: () => void;
}

class Observer {
  private isUnsubscribed: boolean;
  private _unsubscribe?: () => void;

  constructor(private handlers: IObserverHandlers) {
    this.isUnsubscribed = false;
  }

  next(value: IRequest): void {
    if (this.handlers.next && !this.isUnsubscribed) {
      this.handlers.next(value);
    }
  }

  error(error: Error): void {
    if (!this.isUnsubscribed) {
      if (this.handlers.error) {
        this.handlers.error(error);
      }

      this.unsubscribe();
    }
  }

  complete(): void {
    if (!this.isUnsubscribed) {
      if (this.handlers.complete) {
        this.handlers.complete();
      }

      this.unsubscribe();
    }
  }

  unsubscribe(): void {
    this.isUnsubscribed = true;

    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }
}

class Observable {
  private _subscribe: (observer: Observer) => () => void;

  constructor(subscribe: (observer: Observer) => () => void) {
    this._subscribe = subscribe;
  }

  static from(values: IRequest[]): Observable {
    return new Observable((observer) => {
      values.forEach((value) => observer.next(value));

      observer.complete();

      return () => {
        console.log("unsubscribed");
      };
    });
  }

  subscribe(obs: IObserverHandlers): { unsubscribe: () => void } {
    const observer = new Observer(obs);

    observer.unsubscribe = this._subscribe(observer);

    return {
      unsubscribe() {
        observer.unsubscribe();
      },
    };
  }
}

const userMock: IUser = {
  name: "User Name",
  age: 26,
  roles: ["user", "admin"],
  createdAt: new Date(),
  isDeleted: false,
};

const requestsMock: IRequest[] = [
  {
    method: HttpMethods.HTTP_POST_METHOD,
    host: "service.example",
    path: "user",
    body: userMock,
    params: {},
  },
  {
    method: HttpMethods.HTTP_GET_METHOD,
    host: "service.example",
    path: "user",
    params: {
      id: "3f5h67s4s",
    },
  },
];

const handleRequest = (_request: IRequest) => {
  // handling of request
  return { status: HttpStatusCodes.HTTP_STATUS_OK };
};
const handleError = (_error: Error) => {
  // handling of error
  return { status: HttpStatusCodes.HTTP_STATUS_INTERNAL_SERVER_ERROR };
};

const handleComplete = (): void => console.log("complete");

const requests$ = Observable.from(requestsMock);

const subscription = requests$.subscribe({
  next: handleRequest,
  error: handleError,
  complete: handleComplete,
});

subscription.unsubscribe();
