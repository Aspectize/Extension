using System;
using System.Collections.Generic;
using System.Text;
using System.Data;
using Aspectize.Core;
using System.IO;

namespace DbTrace
{
    [Service(Name = "AzureTraceService", ConfigurationRequired = true)]
    public class AzureTraceService : ITrace //, IInitializable, ISingleton
    {
        [Parameter(Optional = false)]
        string DataServiceName = "";

        [Parameter(Optional = false)]
        string FileServiceName = "";

        void ITrace.WriteTrace(TraceInfo traceInfo)
        {
            IDataManager dm = EntityManager.FromDataBaseService(DataServiceName);

            IEntityManager em = dm as IEntityManager;

            Trace trace = em.CreateInstance<Trace>();

            trace.ApplicationName = traceInfo.ApplicationName;
            trace.CommandName = traceInfo.CommandName;
            trace.InfoType = traceInfo.InfoType.ToString();
            trace.InfoTypeName = traceInfo.InfoTypeName;
            //trace.Message = traceInfo.Message.Length > 10000 ? traceInfo.Message.Substring(0, 10000) : traceInfo.Message;
            trace.Received = traceInfo.Received;
            trace.ServiceName = traceInfo.ServiceName;
            trace.UserHost = traceInfo.UserHost;
            trace.UserAgent = (System.Web.HttpContext.Current != null && System.Web.HttpContext.Current.Request != null) ? System.Web.HttpContext.Current.Request.UserAgent : "";

            bool messageTooLong = traceInfo.Message.Length > 32000;

            if (messageTooLong)
            {
                IFileService fs = ExecutingContext.GetService<IFileService>(FileServiceName);

                Guid fileId = Guid.NewGuid();

                string fileName = string.Format("Trace/{0}.txt", fileId);

                trace.Message = fileName;

                using (Stream s = GenerateStreamFromString(traceInfo.Message))
                {
                    fs.Write(fileName, s);
                }
            }
            else
            {
                trace.Message = traceInfo.Message;
            }

            dm.SaveTransactional();
        }


        private static Stream GenerateStreamFromString(string s)
        {
            MemoryStream stream = new MemoryStream();
            StreamWriter writer = new StreamWriter(stream);
            writer.Write(s);
            writer.Flush();
            stream.Position = 0;
            return stream;
        }
    }

}
