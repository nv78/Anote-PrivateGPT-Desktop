import json

def prompt_example(text):
    prompt = f'''
        Your task is to summarize the following text, which is delimited with triple dashes, to the JSON format I provided, which is delimited with triple backticks.
        Then return and only return the JSON String with a translation of all the keys and values in English.
        ---
        {text}
        ---

        ```
        {{position: string,
        company: string,
        is_fulltime: boolean,
        start_date: string,
        end_date: string}}
        ```
        '''
    return prompt