import axios, { AxiosInstance } from "axios";

export const createTMDBClient = (): AxiosInstance => {
  return axios.create({
    baseURL: process.env.TMDB_BASE_URL,
    headers: {
      Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
      "Content-Type": "application/json",
    },
  });
};