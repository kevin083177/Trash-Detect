# import os, time, sys
# from watchdog.observers import Observer
# from watchdog.events import FileSystemEventHandler
# from utils.logger_config import logger

# class FileChangeHandler(FileSystemEventHandler):
#     def __init__(self, app_root):
#         self.app_root = app_root
#         self.last_reload = time.time()
#         self.reload_delay = 1  # 設定重新載入的最小間隔（秒）

#     def on_modified(self, event):
#         if event.is_directory:
#             return

#         # 檢查是否是 Python 檔案
#         if not event.src_path.endswith('.py'):
#             return

#         current_time = time.time()
#         if current_time - self.last_reload < self.reload_delay:
#             return

#         # 取得相對路徑
#         relative_path = os.path.relpath(event.src_path, self.app_root)
#         logger.info(f"Detect file change in: {relative_path}, restarting server...")
#         self.last_reload = current_time
        
#         # 重啟 Python 程序
#         python = sys.executable
#         os.execl(python, python, *sys.argv)

# def start_file_watcher(app_root):
#     event_handler = FileChangeHandler(app_root)
#     observer = Observer()
#     observer.schedule(event_handler, app_root, recursive=True)
#     observer.start()
#     return observer