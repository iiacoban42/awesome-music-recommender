
FROM  python:3.9

ENV PATH="/scripts:${PATH}"

# Always flush output directly
ENV PYTHONBUFFERED=1

# install dependencies
COPY ./requirements.txt /requirements.txt

RUN pip3 install -r /requirements.txt

# add the code to the docker image
RUN mkdir /app
COPY ./src /app
WORKDIR /app

# add directories for static
RUN mkdir -p /vol/web/media
RUN mkdir -p /vol/web/static

# create a new user in the docker image to run the server, not as root
RUN adduser user
RUN chown -R user:user /vol
RUN chmod -R 755 /vol/web

USER user

# run the startup script
CMD ["entrypoint.sh"]
