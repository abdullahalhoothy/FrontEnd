// src/utils/urlUtils.ts
import { useLocation } from 'react-router-dom';

/**
 * A custom hook that returns the current URL query parameters as a URLSearchParams object.
 *
 * @returns {URLSearchParams} The current URL query parameters.
 *
 * @example
 * // If the current URL is 'https://example.com/page?id=1&name=John'
 * const query = useQuery();
 * console.log(query.get('id')); // '1'
 * console.log(query.get('name')); // 'John'
 */
export const useGetQueryParamObj = () => {
  return new URLSearchParams(useLocation().search);
};

/**
 * Creates a query string from an object of key-value pairs.
 *
 * @param {Object} queryObject - The object containing the key-value pairs to be converted into a query string.
 * @returns {string} The generated query string, including the leading '?' character if the query object is not empty.
 *
 * @example
 * const params = {
 *   id: 1,
 *   name: 'John',
 *   tags: ['user', 'admin'],
 * };
 * const queryString = createQueryString(params);
 * console.log(queryString); // '?id=1&name=John&tags=user&tags=admin'
 *
 * @example
 * const paramsWithEmptyValues = {
 *   id: 1,
 *   name: '',
 *   tags: [],
 *   settings: null,
 * };
 * const filteredQueryString = createQueryString(paramsWithEmptyValues);
 * console.log(filteredQueryString); // '?id=1'
 */
export function createQueryString(queryObject: any = {}) {
  let queryString = Object.keys(queryObject)
    .filter(
      (key) =>
        queryObject[key] &&
        !(Array.isArray(queryObject[key]) && !queryObject[key].length)
    )
    .map((key) => {
      return Array.isArray(queryObject[key])
        ? queryObject[key]
            .map(
              (item: any) =>
                `${encodeURIComponent(key)}=${encodeURIComponent(item)}`
            )
            .join("&")
        : `${encodeURIComponent(key)}=${encodeURIComponent(queryObject[key])}`;
    })
    .join("&");
  return queryString ? `?${queryString}` : "";
}