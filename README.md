Самоорганизующаяся карта Кохонена с настройкой входных воздействия для классификации изображений.
В файле SOM.js в строчках 10 или 11 укажите соответствующую папку с необходимым изображениями, а в строке 8 укажите соответствующее количество изображений, которое имеется в указанной папке.
Для работы с данной картой необходимо установить python: https://www.python.org/.
После этого зайтиде в папку classificationImagesBySOM через командную строку и напишите команду: python -m http.server
Откройте в браузере ссылку которая была указана после запуска сервера и нажмите клавишу F12.
Перейдите во вкладку console введите nn.action(), дождитесь результата. Повторяйте данную команду пока не получите необходимый результат.