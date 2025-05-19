
import { getUserId } from '@/lib/getuserid';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Use relative URLs for Next.js API routes when in the browser
export const baseApiURL = '/api';

export const api = createApi({
  baseQuery: fetchBaseQuery(
    {
      baseUrl: baseApiURL,
      prepareHeaders: (headers) => {
        const userId = getUserId();
        headers.set('x-user-id', userId);
      }
    }
  ),
  endpoints: () => ({}),
});